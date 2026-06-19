import { HttpTypes } from "@medusajs/types"
import { Container } from "@modules/common/components/ui"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"

type GooglePlace = {
  address_components?: GoogleAddressComponent[]
}

type GoogleAddressComponent = {
  long_name: string
  short_name: string
  types: string[]
}

type GoogleMapsWindow = Window & {
  google?: {
    maps?: {
      places?: {
        Autocomplete: new (
          input: HTMLInputElement,
          options?: {
            componentRestrictions?: { country: string | string[] }
            fields?: string[]
            types?: string[]
          }
        ) => {
          addListener: (eventName: string, handler: () => void) => void
          getPlace: () => GooglePlace
        }
      }
    }
  }
}

const GOOGLE_PLACES_SCRIPT_ID = "google-maps-places-script"
const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

const getAddressPart = (
  components: GoogleAddressComponent[],
  type: string,
  name: "long_name" | "short_name" = "long_name"
) =>
  components.find((component) => component.types.includes(type))?.[name] || ""

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
}) => {
  const addressInputRef = React.useRef<HTMLInputElement>(null)
  const hasInitializedPlacesRef = React.useRef(false)
  const [formData, setFormData] = useState<Record<string, string>>({
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.company": cart?.shipping_address?.company || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code": cart?.shipping_address?.country_code || "",
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": cart?.shipping_address?.phone || "",
    email: cart?.email || "",
  })

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )

  // check if customer has saved addresses that are in the current region
  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const autocompleteCountryCode = useMemo(
    () =>
      cart?.shipping_address?.country_code ||
      cart?.region?.countries?.[0]?.iso_2 ||
      "nz",
    [cart?.region?.countries, cart?.shipping_address?.country_code]
  )

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    if (address) {
      setFormData((prevState: Record<string, string>) => ({
        ...prevState,
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.company": address?.company || "",
        "shipping_address.postal_code": address?.postal_code || "",
        "shipping_address.city": address?.city || "",
        "shipping_address.country_code": address?.country_code || "",
        "shipping_address.province": address?.province || "",
        "shipping_address.phone": address?.phone || "",
      }))
    }

    if (email) {
      setFormData((prevState: Record<string, string>) => ({
        ...prevState,
        email: email,
      }))
    }
  }

  useEffect(() => {
    // Ensure cart is not null and has a shipping_address before setting form data
    if (cart && cart.shipping_address) {
      setFormAddress(cart?.shipping_address, cart?.email)
    }

    if (cart && !cart.email && customer?.email) {
      setFormAddress(undefined, customer.email)
    }
  }, [cart, customer?.email]) // Add cart as a dependency

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
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
        !googleWindow.google?.maps?.places?.Autocomplete
      ) {
        return
      }

      hasInitializedPlacesRef.current = true

      const autocomplete = new googleWindow.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          componentRestrictions: { country: autocompleteCountryCode },
          fields: ["address_components"],
          types: ["address"],
        }
      )

      autocomplete.addListener("place_changed", () => {
        const components = autocomplete.getPlace().address_components || []
        const streetNumber = getAddressPart(components, "street_number")
        const route = getAddressPart(components, "route")
        const suburb =
          getAddressPart(components, "sublocality_level_1") ||
          getAddressPart(components, "sublocality")
        const city =
          getAddressPart(components, "locality") ||
          getAddressPart(components, "postal_town") ||
          getAddressPart(components, "administrative_area_level_2")
        const province = getAddressPart(
          components,
          "administrative_area_level_1"
        )
        const postalCode = getAddressPart(components, "postal_code")
        const country = getAddressPart(components, "country", "short_name")

        setFormData((prevState) => ({
          ...prevState,
          "shipping_address.address_1":
            [streetNumber, route].filter(Boolean).join(" ") ||
            prevState["shipping_address.address_1"],
          "shipping_address.company": prevState["shipping_address.company"],
          "shipping_address.postal_code": postalCode,
          "shipping_address.city": suburb ? `${suburb}, ${city}` : city,
          "shipping_address.country_code": country.toLowerCase(),
          "shipping_address.province": province,
        }))
      })
    }

    if ((window as GoogleMapsWindow).google?.maps?.places?.Autocomplete) {
      initAutocomplete()
    } else {
      const existingScript = document.getElementById(GOOGLE_PLACES_SCRIPT_ID)

      if (existingScript) {
        existingScript.addEventListener("load", initAutocomplete, {
          once: true,
        })
      } else {
        const script = document.createElement("script")
        script.id = GOOGLE_PLACES_SCRIPT_ID
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&loading=async&language=en-NZ&region=NZ`
        script.async = true
        script.defer = true
        script.addEventListener("load", initAutocomplete, { once: true })
        document.head.appendChild(script)
      }
    }

    return () => {
      isMounted = false
    }
  }, [autocompleteCountryCode])

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5">
          <p className="text-small-regular">
            {`Hi ${customer.first_name}, do you want to use one of your saved addresses?`}
          </p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={
              mapKeys(formData, (_, key) =>
                key.replace("shipping_address.", "")
              ) as unknown as HttpTypes.StoreCartAddress
            }
            onSelect={setFormAddress}
          />
        </Container>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First name"
          name="shipping_address.first_name"
          autoComplete="given-name"
          value={formData["shipping_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-first-name-input"
        />
        <Input
          label="Last name"
          name="shipping_address.last_name"
          autoComplete="family-name"
          value={formData["shipping_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-last-name-input"
        />
        <Input
          label="Address"
          name="shipping_address.address_1"
          ref={addressInputRef}
          autoComplete="address-line1"
          value={formData["shipping_address.address_1"]}
          onChange={handleChange}
          required
          data-testid="shipping-address-input"
        />
        <Input
          label="Company"
          name="shipping_address.company"
          value={formData["shipping_address.company"]}
          onChange={handleChange}
          autoComplete="organization"
          data-testid="shipping-company-input"
        />
        <Input
          label="Postal code"
          name="shipping_address.postal_code"
          autoComplete="postal-code"
          value={formData["shipping_address.postal_code"]}
          onChange={handleChange}
          required
          data-testid="shipping-postal-code-input"
        />
        <Input
          label="City"
          name="shipping_address.city"
          autoComplete="address-level2"
          value={formData["shipping_address.city"]}
          onChange={handleChange}
          required
          data-testid="shipping-city-input"
        />
        <CountrySelect
          name="shipping_address.country_code"
          autoComplete="country"
          region={cart?.region}
          value={formData["shipping_address.country_code"]}
          onChange={handleChange}
          required
          data-testid="shipping-country-select"
        />
        <Input
          label="State / Province"
          name="shipping_address.province"
          autoComplete="address-level1"
          value={formData["shipping_address.province"]}
          onChange={handleChange}
          data-testid="shipping-province-input"
        />
      </div>
      <div className="my-8">
        <Checkbox
          label="Billing address same as shipping address"
          name="same_as_billing"
          checked={checked}
          onChange={onChange}
          data-testid="billing-address-checkbox"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Input
          label="Email"
          name="email"
          type="email"
          title="Enter a valid email address."
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
          data-testid="shipping-email-input"
        />
        <Input
          label="Phone"
          name="shipping_address.phone"
          autoComplete="tel"
          value={formData["shipping_address.phone"]}
          onChange={handleChange}
          data-testid="shipping-phone-input"
        />
      </div>
    </>
  )
}

export default ShippingAddress
