"use client"

import { updateCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { useRouter } from "next/navigation"
import {
  FormEvent,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import StepHeader from "../step-header"

type GooglePlace = {
  address_components?: GoogleAddressComponent[]
}

type GoogleAddressComponent = {
  long_name: string
  short_name: string
  types: string[]
}

type GoogleAutocompletePrediction = {
  description: string
  place_id: string
  structured_formatting?: {
    main_text?: string
    secondary_text?: string
  }
}

type GoogleMapsWindow = Window & {
  gm_authFailure?: () => void
  google?: {
    maps?: {
      places?: {
        AutocompleteSessionToken: new () => unknown
        AutocompleteService: new () => {
          getPlacePredictions: (
            request: {
              input: string
              componentRestrictions?: { country: string | string[] }
              types?: string[]
              sessionToken?: unknown
            },
            callback: (
              predictions: GoogleAutocompletePrediction[] | null,
              status: string
            ) => void
          ) => void
        }
        PlacesService: new (element: HTMLDivElement) => {
          getDetails: (
            request: { placeId: string; fields: string[] },
            callback: (place: GooglePlace | null, status: string) => void
          ) => void
        }
      }
    }
  }
}

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const MIN_ADDRESS_AUTOCOMPLETE_CHARS = 1
const GOOGLE_PLACES_READY_TIMEOUT_MS = 10_000

const getAddressPart = (
  components: GoogleAddressComponent[],
  type: string,
  name: "long_name" | "short_name" = "long_name"
) =>
  components.find((component) => component.types.includes(type))?.[name] || ""

type Props = {
  cart: HttpTypes.StoreCart
  isActive: boolean
  isComplete: boolean
  stepNumber: number
  onComplete: () => void
  onEdit: () => void
}

type AddressForm = {
  first_name: string
  last_name: string
  address_1: string
  address_2: string
  postal_code: string
  city: string
  country_code: string
  province: string
  phone: string
}

export default function StepShipping({
  cart,
  isActive,
  isComplete,
  stepNumber,
  onComplete,
  onEdit,
}: Props) {
  const addressInputRef = useRef<HTMLInputElement>(null)
  const placesServiceElementRef = useRef<HTMLDivElement | null>(null)
  const hasInitializedPlacesRef = useRef(false)
  const latestPredictionInputRef = useRef("")
  const autocompleteServiceRef = useRef<{
    getPlacePredictions: (
      request: {
        input: string
        componentRestrictions?: { country: string | string[] }
        types?: string[]
        sessionToken?: unknown
      },
      callback: (
        predictions: GoogleAutocompletePrediction[] | null,
        status: string
      ) => void
    ) => void
  } | null>(null)
  const placesServiceRef = useRef<{
    getDetails: (
      request: { placeId: string; fields: string[] },
      callback: (place: GooglePlace | null, status: string) => void
    ) => void
  } | null>(null)
  const autocompleteSessionTokenRef = useRef<unknown>(null)
  const [addressPredictions, setAddressPredictions] = useState<
    GoogleAutocompletePrediction[]
  >([])
  const [isFetchingPredictions, setIsFetchingPredictions] = useState(false)
  const [isAddressFocused, setIsAddressFocused] = useState(false)
  const [placesStatusMessage, setPlacesStatusMessage] = useState<string | null>(
    googleMapsApiKey ? null : "Google address autocomplete is not configured on this deployment."
  )
  const [form, setForm] = useState<AddressForm>({
    first_name: cart.shipping_address?.first_name ?? "",
    last_name: cart.shipping_address?.last_name ?? "",
    address_1: cart.shipping_address?.address_1 ?? "",
    address_2: cart.shipping_address?.address_2 ?? "",
    postal_code: cart.shipping_address?.postal_code ?? "",
    city: cart.shipping_address?.city ?? "",
    country_code: cart.shipping_address?.country_code ?? "nz",
    province: cart.shipping_address?.province ?? "",
    phone: cart.shipping_address?.phone ?? "",
  })
  const [sameAsBilling, setSameAsBilling] = useState(true)
  const [billingForm, setBillingForm] = useState<AddressForm>({
    first_name: cart.billing_address?.first_name ?? "",
    last_name: cart.billing_address?.last_name ?? "",
    address_1: cart.billing_address?.address_1 ?? "",
    address_2: cart.billing_address?.address_2 ?? "",
    postal_code: cart.billing_address?.postal_code ?? "",
    city: cart.billing_address?.city ?? "",
    country_code: cart.billing_address?.country_code ?? "nz",
    province: cart.billing_address?.province ?? "",
    phone: cart.billing_address?.phone ?? "",
  })
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const address = cart.shipping_address
  const autocompleteCountryCode = useMemo(
    () => form.country_code || cart.shipping_address?.country_code || "nz",
    [cart.shipping_address?.country_code, form.country_code]
  )

  function updateField(name: keyof AddressForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function updateBillingField(name: keyof AddressForm, value: string) {
    setBillingForm((current) => ({ ...current, [name]: value }))
  }

  function applyAddressComponents(components: GoogleAddressComponent[]) {
    const streetNumber = getAddressPart(components, "street_number")
    const route = getAddressPart(components, "route")
    const suburb =
      getAddressPart(components, "sublocality_level_1") ||
      getAddressPart(components, "sublocality")
    const city =
      getAddressPart(components, "locality") ||
      getAddressPart(components, "postal_town") ||
      getAddressPart(components, "administrative_area_level_2")
    const postcode = getAddressPart(components, "postal_code")
    const country = getAddressPart(components, "country", "short_name")

    setForm((current) => ({
      ...current,
      address_1:
        [streetNumber, route].filter(Boolean).join(" ") || current.address_1,
      province: suburb || current.province,
      city: city || current.city,
      postal_code: postcode || current.postal_code,
      country_code: country.toLowerCase() || current.country_code,
    }))
  }

  function fetchAddressPredictions(value: string) {
    const nextInput = value.trim()
    latestPredictionInputRef.current = nextInput

    if (
      !autocompleteServiceRef.current ||
      nextInput.length < MIN_ADDRESS_AUTOCOMPLETE_CHARS
    ) {
      setIsFetchingPredictions(false)
      setAddressPredictions([])
      return
    }

    setIsFetchingPredictions(true)
    autocompleteServiceRef.current.getPlacePredictions(
      {
        input:
          autocompleteCountryCode === "nz"
            ? `${nextInput}, New Zealand`
            : nextInput,
        componentRestrictions: { country: autocompleteCountryCode },
        types: ["address"],
        sessionToken: autocompleteSessionTokenRef.current,
      },
      (predictions, status) => {
        if (latestPredictionInputRef.current !== nextInput) {
          return
        }

        setIsFetchingPredictions(false)
        setAddressPredictions(predictions?.slice(0, 5) ?? [])
        if (status !== "OK" && status !== "ZERO_RESULTS") {
          setPlacesStatusMessage(
            "Google address autocomplete is unavailable. Enable Maps JavaScript API and Places API (Legacy) for this key, then allow this site in its referrer restrictions."
          )
        }
      }
    )
  }

  function handleAddressChange(value: string) {
    updateField("address_1", value)
    fetchAddressPredictions(value)
  }

  function handlePredictionSelect(prediction: GoogleAutocompletePrediction) {
    setForm((current) => ({
      ...current,
      address_1: prediction.structured_formatting?.main_text || prediction.description,
    }))
    setAddressPredictions([])
    setIsAddressFocused(false)

    if (!placesServiceRef.current) {
      return
    }

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["address_components"],
      },
      (place) => {
        applyAddressComponents(place?.address_components || [])
        const places = (window as GoogleMapsWindow).google?.maps?.places
        autocompleteSessionTokenRef.current = places
          ? new places.AutocompleteSessionToken()
          : null
      }
    )
  }

  useEffect(() => {
    if (!googleMapsApiKey || !addressInputRef.current) {
      return
    }

    let isMounted = true

    const initAutocomplete = () => {
      const googleWindow = window as GoogleMapsWindow

      if (
        !isMounted ||
        hasInitializedPlacesRef.current ||
        !addressInputRef.current ||
        !googleWindow.google?.maps?.places?.AutocompleteService
      ) {
        return
      }

      hasInitializedPlacesRef.current = true

      const places = googleWindow.google.maps.places
      autocompleteServiceRef.current = new places.AutocompleteService()
      autocompleteSessionTokenRef.current = new places.AutocompleteSessionToken()
      if (!placesServiceElementRef.current) {
        placesServiceElementRef.current = document.createElement("div")
      }
      placesServiceRef.current = new places.PlacesService(
        placesServiceElementRef.current
      )
      setPlacesStatusMessage(null)
      if (
        isAddressFocused &&
        latestPredictionInputRef.current.length >= MIN_ADDRESS_AUTOCOMPLETE_CHARS
      ) {
        fetchAddressPredictions(latestPredictionInputRef.current)
      }
    }

    const googleWindow = window as GoogleMapsWindow
    const previousAuthFailureHandler = googleWindow.gm_authFailure
    googleWindow.gm_authFailure = () => {
      previousAuthFailureHandler?.()
      setPlacesStatusMessage(
        "Google rejected the address-lookup key. Enable Maps JavaScript API and Places API (Legacy), billing, and an allowed referrer for this checkout domain."
      )
    }

    // The Google Maps script itself is loaded once, page-level, via
    // next/script in checkout-page-muse (id="google-maps-places-script").
    // Don't create a second <script> tag here — Google Maps does not
    // support being loaded twice on the same page, and that previously
    // risked the `places` library silently failing to attach. Just poll
    // for it to become ready.
    let readyTimer: number | undefined
    const waitForPlaces = () => {
      if (googleWindow.google?.maps?.places?.AutocompleteService) {
        initAutocomplete()
        return
      }

      readyTimer = window.setTimeout(waitForPlaces, 100)
    }

    waitForPlaces()

    const deadlineTimer = window.setTimeout(() => {
      if (!hasInitializedPlacesRef.current) {
        window.clearTimeout(readyTimer)
        setPlacesStatusMessage(
          "Google address autocomplete did not become ready. Check the Maps JavaScript API, Places API (Legacy), billing, and key restrictions."
        )
      }
    }, GOOGLE_PLACES_READY_TIMEOUT_MS)

    return () => {
      isMounted = false
      window.clearTimeout(readyTimer)
      window.clearTimeout(deadlineTimer)
      googleWindow.gm_authFailure = previousAuthFailureHandler
    }
  }, [autocompleteCountryCode])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const shippingAddress = {
      first_name: form.first_name,
      last_name: form.last_name,
      address_1: form.address_1,
      address_2: form.address_2,
      company: "",
      postal_code: form.postal_code,
      city: form.city,
      country_code: form.country_code.toLowerCase(),
      province: form.province,
      phone: form.phone,
    }
    const billingAddress = sameAsBilling
      ? shippingAddress
      : {
          first_name: billingForm.first_name,
          last_name: billingForm.last_name,
          address_1: billingForm.address_1,
          address_2: billingForm.address_2,
          company: "",
          postal_code: billingForm.postal_code,
          city: billingForm.city,
          country_code: billingForm.country_code.toLowerCase(),
          province: billingForm.province,
          phone: billingForm.phone,
        }

    startTransition(async () => {
      await updateCart({
        shipping_address: shippingAddress,
        billing_address: billingAddress,
        email: cart.email,
      })
      router.refresh()
      onComplete()
    })
  }

  return (
    <section id="step-shipping">
      <StepHeader
        stepNumber={stepNumber}
        isComplete={isComplete}
        title="Shipping address"
        onEdit={onEdit}
      />

      {isComplete && !isActive && address && (
        <div className="rounded-2xl border border-muse-border bg-muse-cream-warm px-4 py-3.5 text-[13px] text-muse-text-muted">
          <strong className="text-muse-black">
            {address.first_name} {address.last_name}
          </strong>
          {" - "}
          {address.address_1}, {address.city}
        </div>
      )}

      {isActive && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 xsmall:grid-cols-2">
            <Field label="First name" placeholder="First name" value={form.first_name} onChange={(value) => updateField("first_name", value)} autoComplete="given-name" required />
            <Field label="Last name" placeholder="Last name" value={form.last_name} onChange={(value) => updateField("last_name", value)} autoComplete="family-name" required />
            <Field label="Address" placeholder="Start typing your address..." value={form.address_1} onChange={handleAddressChange} autoComplete="new-password" required className="xsmall:col-span-2" inputRef={addressInputRef} name="muse-delivery-address-search" onFocus={() => { setIsAddressFocused(true); fetchAddressPredictions(form.address_1) }} onBlur={() => window.setTimeout(() => setIsAddressFocused(false), 160)} predictions={isAddressFocused ? addressPredictions : []} isFetchingPredictions={isAddressFocused && isFetchingPredictions} onPredictionSelect={handlePredictionSelect} helperText={placesStatusMessage ?? undefined} />
            <Field label="Apartment, suite, unit (optional)" placeholder="Apt 2B" value={form.address_2} onChange={(value) => updateField("address_2", value)} autoComplete="address-line2" className="xsmall:col-span-2" />
            <Field label="Suburb" placeholder="Ponsonby" value={form.province} onChange={(value) => updateField("province", value)} autoComplete="address-level3" required />
            <Field label="City" placeholder="Auckland" value={form.city} onChange={(value) => updateField("city", value)} autoComplete="address-level2" required />
            <Field label="Postcode" placeholder="1011" value={form.postal_code} onChange={(value) => updateField("postal_code", value)} autoComplete="postal-code" required maxLength={4} />
            <label className="flex flex-col gap-1.5 xsmall:col-span-2">
              <span className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-muse-text-muted">
                Country
              </span>
              <select
                value={form.country_code}
                onChange={(event) => updateField("country_code", event.target.value)}
                className="w-full rounded-xl border border-muse-input bg-white px-4 py-3.5 text-[14px] text-muse-black outline-none transition focus:border-muse-black focus:ring-2 focus:ring-black/5"
                required
              >
                {(cart.region?.countries ?? []).map((country) => (
                  <option key={country.iso_2} value={country.iso_2 ?? ""}>
                    {country.display_name ?? country.iso_2?.toUpperCase()}
                  </option>
                ))}
                {!cart.region?.countries?.length && <option value="nz">New Zealand</option>}
              </select>
            </label>
            <Field
              label="Phone"
              labelExtra="(optional)"
              placeholder="+64 21 000 0000"
              type="tel"
              value={form.phone}
              onChange={(value) => updateField("phone", value)}
              autoComplete="tel"
              className="xsmall:col-span-2"
            />
          </div>

          <p className="-mt-1 text-[12px] leading-relaxed text-muse-text-muted">
            Phone is only used if the courier needs help delivering your parcel.
          </p>

          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-muse-text-muted">
            <input
              type="checkbox"
              checked={sameAsBilling}
              onChange={(event) => setSameAsBilling(event.target.checked)}
              className="accent-muse-black"
            />
            Billing address same as shipping
          </label>

          {!sameAsBilling && (
            <div className="space-y-3 rounded-2xl border border-muse-border bg-muse-cream-warm/50 p-4">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-muse-text-muted">
                Billing address
              </p>
              <div className="grid gap-3 xsmall:grid-cols-2">
                <Field label="First name" placeholder="First name" value={billingForm.first_name} onChange={(value) => updateBillingField("first_name", value)} autoComplete="given-name" required />
                <Field label="Last name" placeholder="Last name" value={billingForm.last_name} onChange={(value) => updateBillingField("last_name", value)} autoComplete="family-name" required />
                <Field label="Address" placeholder="Street address" value={billingForm.address_1} onChange={(value) => updateBillingField("address_1", value)} autoComplete="address-line1" required className="xsmall:col-span-2" />
                <Field label="Apartment, suite, unit (optional)" placeholder="Apt 2B" value={billingForm.address_2} onChange={(value) => updateBillingField("address_2", value)} autoComplete="address-line2" className="xsmall:col-span-2" />
                <Field label="Suburb" placeholder="Ponsonby" value={billingForm.province} onChange={(value) => updateBillingField("province", value)} autoComplete="address-level3" required />
                <Field label="City" placeholder="Auckland" value={billingForm.city} onChange={(value) => updateBillingField("city", value)} autoComplete="address-level2" required />
                <Field label="Postcode" placeholder="1011" value={billingForm.postal_code} onChange={(value) => updateBillingField("postal_code", value)} autoComplete="postal-code" required maxLength={4} />
                <label className="flex flex-col gap-1.5 xsmall:col-span-2">
                  <span className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-muse-text-muted">
                    Country
                  </span>
                  <select
                    value={billingForm.country_code}
                    onChange={(event) => updateBillingField("country_code", event.target.value)}
                    className="w-full rounded-xl border border-muse-input bg-white px-4 py-3.5 text-[14px] text-muse-black outline-none transition focus:border-muse-black focus:ring-2 focus:ring-black/5"
                    required
                  >
                    {(cart.region?.countries ?? []).map((country) => (
                      <option key={country.iso_2} value={country.iso_2 ?? ""}>
                        {country.display_name ?? country.iso_2?.toUpperCase()}
                      </option>
                    ))}
                    {!cart.region?.countries?.length && <option value="nz">New Zealand</option>}
                  </select>
                </label>
                <Field
                  label="Phone"
                  labelExtra="(optional)"
                  placeholder="+64 21 000 0000"
                  type="tel"
                  value={billingForm.phone}
                  onChange={(value) => updateBillingField("phone", value)}
                  autoComplete="tel"
                  className="xsmall:col-span-2"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-muse-black py-4 text-[13px] font-extrabold uppercase tracking-widest text-muse-cream transition hover:bg-muse-orange disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Continue to delivery"}
          </button>
        </form>
      )}
    </section>
  )
}

function Field({
  label,
  labelExtra,
  placeholder,
  type = "text",
  value,
  onChange,
  autoComplete,
  required,
  maxLength,
  className = "",
  inputRef,
  name,
  onFocus,
  onBlur,
  predictions = [],
  isFetchingPredictions = false,
  onPredictionSelect,
  helperText,
}: {
  label: string
  labelExtra?: string
  placeholder?: string
  type?: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  required?: boolean
  maxLength?: number
  className?: string
  inputRef?: RefObject<HTMLInputElement | null>
  name?: string
  onFocus?: () => void
  onBlur?: () => void
  predictions?: GoogleAutocompletePrediction[]
  isFetchingPredictions?: boolean
  onPredictionSelect?: (prediction: GoogleAutocompletePrediction) => void
  helperText?: string
}) {
  return (
    <label className={`relative flex flex-col gap-1.5 ${className}`}>
      <span className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-muse-text-muted">
        {label}
        {labelExtra && (
          <span className="ml-1 font-medium normal-case tracking-normal text-muse-text-light">
            {labelExtra}
          </span>
        )}
      </span>
      <input
        ref={inputRef}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        autoComplete={autoComplete}
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        className="w-full rounded-xl border border-muse-input bg-white px-4 py-3.5 text-[14px] text-muse-black outline-none transition placeholder:text-[#c0bdb8] focus:border-muse-black focus:ring-2 focus:ring-black/5"
      />
      {helperText && (
        <span className="text-[11px] font-medium leading-relaxed text-muse-text-light">
          {helperText}
        </span>
      )}
      {(isFetchingPredictions || predictions.length > 0) && (
        <div className="absolute left-0 right-0 top-full z-[9999] mt-2 overflow-hidden rounded-2xl border border-muse-border bg-white shadow-[0_14px_36px_rgba(0,0,0,0.14)]">
          <div className="border-b border-muse-border px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-muse-text-light">
            Google address suggestions
          </div>
          {isFetchingPredictions && predictions.length === 0 && (
            <div className="px-4 py-3 text-[12px] font-semibold text-muse-text-muted">
              Loading address suggestions...
            </div>
          )}
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              className="flex w-full items-start gap-3 border-b border-muse-border px-4 py-3 text-left transition last:border-b-0 hover:bg-muse-cream-warm"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onPredictionSelect?.(prediction)}
            >
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-muse-input text-[10px] font-black text-muse-text-muted">
                G
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-bold text-muse-black">
                  {prediction.structured_formatting?.main_text ||
                    prediction.description}
                </span>
                {prediction.structured_formatting?.secondary_text && (
                  <span className="block text-[12px] text-muse-text-muted">
                    {prediction.structured_formatting.secondary_text}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </label>
  )
}
