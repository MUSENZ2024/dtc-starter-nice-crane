"use client"

import {
  initiatePaymentSession,
  placeOrder,
  setShippingMethod,
  updateCart,
} from "@lib/data/cart"
import { isStripeLike } from "@lib/constants"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import { StripeContext } from "@modules/checkout/components/payment-wrapper/stripe-wrapper"
import { ExpressCheckoutElement, useElements, useStripe } from "@stripe/react-stripe-js"
import {
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementOptions,
  StripeExpressCheckoutElementShippingAddressChangeEvent,
  StripeExpressCheckoutElementShippingRateChangeEvent,
} from "@stripe/stripe-js"
import { useRouter } from "next/navigation"
import { useContext, useEffect, useMemo, useRef, useState } from "react"

type ExpressPayMuseProps = {
  cart: HttpTypes.StoreCart
  paymentMethods: { id: string }[]
  shippingMethods: HttpTypes.StoreCartShippingOption[]
}

type ExpressShippingRate = NonNullable<
  StripeExpressCheckoutElementOptions["shippingRates"]
>[number]

export default function ExpressPayMuse({
  cart,
  paymentMethods,
  shippingMethods,
}: ExpressPayMuseProps) {
  const hasStripeProvider = useContext(StripeContext)
  const router = useRouter()
  const [isStartingStripe, setIsStartingStripe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const didStartStripe = useRef(false)
  const hasStripeSession = Boolean(
    cart.payment_collection?.payment_sessions?.some(
      (session) => session.status === "pending" && session.data?.client_secret
    )
  )
  const defaultStripeMethod = useMemo(
    () => paymentMethods.find((method) => isStripeLike(method.id))?.id,
    [paymentMethods]
  )
  const selectedShippingMethodId =
    cart.shipping_methods?.at(-1)?.shipping_option_id ?? shippingMethods[0]?.id

  useEffect(() => {
    if (
      hasStripeSession ||
      !defaultStripeMethod ||
      didStartStripe.current ||
      isStartingStripe
    ) {
      return
    }

    didStartStripe.current = true
    setIsStartingStripe(true)
    setError(null)

    ;(async () => {
      if (!cart.shipping_methods?.length && selectedShippingMethodId) {
        await setShippingMethod({
          cartId: cart.id,
          shippingMethodId: selectedShippingMethodId,
        })
      }

      await initiatePaymentSession(cart, {
        provider_id: defaultStripeMethod,
      })
      router.refresh()
    })()
      .catch((err) => {
        didStartStripe.current = false
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        setIsStartingStripe(false)
      })
  }, [
    cart,
    defaultStripeMethod,
    hasStripeSession,
    isStartingStripe,
    router,
    selectedShippingMethodId,
  ])

  if (hasStripeProvider && hasStripeSession) {
    return (
      <ExpressPayStripe
        cart={cart}
        shippingMethods={shippingMethods}
        selectedShippingMethodId={selectedShippingMethodId}
      />
    )
  }

  return (
    <section>
      <p className="mb-3.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-muse-text-light">
        Express checkout
      </p>
      {isStartingStripe || defaultStripeMethod ? (
        <ExpressCheckoutLoading />
      ) : (
        <ExpressCheckoutUnavailable />
      )}
      <ErrorMessage error={error} data-testid="express-payment-error-message" />
    </section>
  )
}

function ExpressPayStripe({
  cart,
  shippingMethods,
  selectedShippingMethodId,
}: {
  cart: HttpTypes.StoreCart
  shippingMethods: HttpTypes.StoreCartShippingOption[]
  selectedShippingMethodId?: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isReady, setIsReady] = useState(false)
  const [loadTimedOut, setLoadTimedOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clientSecret = cart.payment_collection?.payment_sessions?.find(
    (session) => session.status === "pending" && session.data?.client_secret
  )?.data.client_secret as string | undefined
  const shippingRates = useMemo(
    () => shippingMethods.map(toStripeShippingRate),
    [shippingMethods]
  )

  useEffect(() => {
    if (isReady) {
      return
    }

    // Stripe's ExpressCheckoutElement never calls onReady when no wallet
    // (Apple Pay/Google Pay/Link) is available in this browsing context, so
    // without a timeout the loading spinner would spin forever.
    const timer = window.setTimeout(() => setLoadTimedOut(true), 6000)
    return () => window.clearTimeout(timer)
  }, [isReady])

  const activeShippingRate =
    shippingRates.find((rate) => rate.id === selectedShippingMethodId) ??
    shippingRates[0]

  return (
    <section>
      <p className="mb-3.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-muse-text-light">
        Express checkout
      </p>
      <div className={isReady ? "block" : "hidden"}>
        <ExpressCheckoutElement
          options={{
            buttonHeight: 52,
            buttonTheme: {
              applePay: "black",
              googlePay: "white",
            },
            buttonType: {
              applePay: "check-out",
              googlePay: "checkout",
            },
            layout: {
              maxColumns: 2,
              maxRows: 2,
              overflow: "auto",
            },
            paymentMethods: {
              applePay: "always",
              googlePay: "always",
              link: "auto",
              klarna: "auto",
            },
            allowedShippingCountries: ["NZ"],
            billingAddressRequired: true,
            emailRequired: true,
            phoneNumberRequired: true,
            shippingAddressRequired: true,
            shippingRates: activeShippingRate ? [activeShippingRate] : undefined,
          }}
          onClick={(event) => {
            if (!activeShippingRate) {
              event.reject()
              setError("Choose a delivery method before using express checkout.")
              return
            }

            event.resolve({
              allowedShippingCountries: ["NZ"],
              billingAddressRequired: true,
              emailRequired: true,
              phoneNumberRequired: true,
              shippingAddressRequired: true,
              shippingRates: [activeShippingRate],
            })
          }}
          onReady={(event) => {
            setError(null)
            setLoadTimedOut(false)
            setIsReady(Boolean(event.availablePaymentMethods))
          }}
          onLoadError={(event) => {
            setError(
              event.error?.message ||
                "Express checkout is unavailable in this browser. Continue with the payment methods below."
            )
            setIsReady(false)
          }}
          onCancel={() => {
            setError(null)
          }}
          onShippingAddressChange={(
            event: StripeExpressCheckoutElementShippingAddressChangeEvent
          ) => {
            if (event.address.country?.toUpperCase() !== "NZ") {
              event.reject()
              return
            }

            event.resolve({
              shippingRates: activeShippingRate ? [activeShippingRate] : undefined,
            })
          }}
          onShippingRateChange={(
            event: StripeExpressCheckoutElementShippingRateChangeEvent
          ) => {
            if (!shippingRates.some((rate) => rate.id === event.shippingRate.id)) {
              event.reject()
              return
            }

            event.resolve()
          }}
          onConfirm={async (event) => {
            setError(null)

            if (!stripe || !elements) {
              setError("Stripe is still loading. Please try again.")
              event.paymentFailed({
                message: "Stripe is still loading. Please try again.",
              })
              return
            }

            const shippingRate = event.shippingRate ?? activeShippingRate
            const shippingMethodId = shippingRate?.id

            if (!shippingMethodId) {
              setError("Choose a delivery method before using express checkout.")
              event.paymentFailed({
                reason: "fail",
                message: "Choose a delivery method before using express checkout.",
              })
              return
            }

            try {
              await applyExpressCheckoutDetails(cart, event, shippingMethodId)
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err)
              setError(message)
              event.paymentFailed({
                reason: message.toLowerCase().includes("address")
                  ? "invalid_shipping_address"
                  : "fail",
                message,
              })
              return
            }

            try {
              const { error: submitError } = await elements.submit()

              if (submitError) {
                const message =
                  submitError.message || "Please check your payment details."
                setError(message)
                event.paymentFailed({
                  reason: "invalid_payment_data",
                  message,
                })
                return
              }

              if (!clientSecret) {
                const message =
                  "The secure payment session expired. Please refresh and try again."
                setError(message)
                event.paymentFailed({
                  reason: "fail",
                  message,
                })
                return
              }

              window.sessionStorage.setItem(
                "muse:lastStripePaymentClientSecret",
                clientSecret
              )

              const { error: confirmError, paymentIntent } =
                await stripe.confirmPayment({
                  elements,
                  clientSecret,
                  confirmParams: {
                    return_url: `${window.location.origin}/${
                      cart.shipping_address?.country_code || "nz"
                    }/checkout/payment-return?cart_id=${cart.id}`,
                  },
                  redirect: "if_required",
                })

              if (confirmError) {
                const message =
                  confirmError.message || "Payment could not be confirmed."
                setError(message)
                event.paymentFailed({
                  reason: "invalid_payment_data",
                  message,
                })
                return
              }

              if (
                paymentIntent &&
                !["requires_capture", "succeeded"].includes(paymentIntent.status)
              ) {
                const message =
                  "Payment is still being processed. Please wait and try again."
                setError(message)
                event.paymentFailed({
                  reason: "fail",
                  message,
                })
                return
              }

              await placeOrder()
            } catch (err) {
              const message =
                err instanceof Error
                  ? err.message
                  : "Payment could not be completed. Please try again."
              setError(message)
              event.paymentFailed({
                reason: "fail",
                message,
              })
            }
          }}
        />
      </div>
      {!isReady && (loadTimedOut ? <ExpressCheckoutUnavailable /> : <ExpressCheckoutLoading />)}
      <ErrorMessage error={error} data-testid="express-payment-error-message" />
    </section>
  )
}

async function applyExpressCheckoutDetails(
  cart: HttpTypes.StoreCart,
  event: StripeExpressCheckoutElementConfirmEvent,
  shippingMethodId: string
) {
  const shippingAddress = event.shippingAddress
  const billingDetails = event.billingDetails
  const email = billingDetails?.email

  if (!shippingAddress?.address?.line1 || !shippingAddress.address.city) {
    throw new Error("Your wallet did not return a complete shipping address.")
  }

  if (!email) {
    throw new Error("Your wallet did not return an email address.")
  }

  const shippingName = splitName(shippingAddress.name || billingDetails?.name)
  const billingName = splitName(billingDetails?.name || shippingAddress.name)
  const shipping = {
    first_name: shippingName.firstName,
    last_name: shippingName.lastName,
    address_1: shippingAddress.address.line1,
    address_2: shippingAddress.address.line2 ?? "",
    city: shippingAddress.address.city,
    province: shippingAddress.address.state ?? "",
    postal_code: shippingAddress.address.postal_code ?? "",
    country_code: shippingAddress.address.country.toLowerCase(),
    phone: billingDetails?.phone ?? "",
  }
  const billingSource = billingDetails?.address ?? shippingAddress.address
  const billing = {
    first_name: billingName.firstName,
    last_name: billingName.lastName,
    address_1: billingSource.line1,
    address_2: billingSource.line2 ?? "",
    city: billingSource.city,
    province: billingSource.state ?? "",
    postal_code: billingSource.postal_code ?? "",
    country_code: billingSource.country.toLowerCase(),
    phone: billingDetails?.phone ?? "",
  }

  await updateCart({
    email,
    shipping_address: shipping,
    billing_address: billing,
  })
  await setShippingMethod({ cartId: cart.id, shippingMethodId })
}

function splitName(name?: string) {
  const parts = (name || "MUSE Customer").trim().split(/\s+/)
  const firstName = parts.shift() || "MUSE"
  const lastName = parts.join(" ") || "Customer"

  return { firstName, lastName }
}

function toStripeShippingRate(
  method: HttpTypes.StoreCartShippingOption
): ExpressShippingRate {
  return {
    id: method.id,
    amount: toStripeSubunitAmount(method.amount ?? 0),
    displayName: method.name || method.type?.label || "Delivery",
  }
}

function toStripeSubunitAmount(amount: number) {
  return Math.round(amount * 100)
}

function ExpressCheckoutLoading() {
  return (
    <div className="mb-2.5 flex min-h-[114px] items-center justify-center rounded-2xl border border-muse-border bg-white">
      <div className="flex items-center gap-2 text-[12.5px] font-bold text-muse-text-muted">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muse-border border-t-muse-black" />
        Loading express checkout...
      </div>
    </div>
  )
}

function ExpressCheckoutUnavailable() {
  return (
    <div className="mb-2.5 rounded-2xl border border-muse-border bg-white px-4 py-5 text-center text-[12.5px] font-semibold text-muse-text-muted">
      Express checkout is unavailable for this cart. Continue with email.
    </div>
  )
}
