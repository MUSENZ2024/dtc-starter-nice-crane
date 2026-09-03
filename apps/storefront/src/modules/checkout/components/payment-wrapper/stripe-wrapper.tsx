"use client"

import { Stripe, StripeElementsOptions } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { HttpTypes } from "@medusajs/types"
import { refreshPaymentSession } from "@lib/data/cart"
import { useRouter } from "next/navigation"
import { createContext, useEffect, useMemo, useState } from "react"

type StripeWrapperProps = {
  paymentSession: HttpTypes.StorePaymentSession
  cart: HttpTypes.StoreCart
  stripeKey?: string
  stripePromise: Promise<Stripe | null> | null
  children: React.ReactNode
}

export const StripeContext = createContext(false)

const StripeWrapper: React.FC<StripeWrapperProps> = ({
  paymentSession,
  cart,
  stripeKey,
  stripePromise,
  children,
}) => {
  const router = useRouter()
  const [sessionState, setSessionState] = useState<
    "checking" | "ready" | "recovering" | "error"
  >("checking")
  const [sessionError, setSessionError] = useState<string | null>(null)
  const clientSecret = paymentSession.data?.client_secret as string | undefined

  const options = useMemo<StripeElementsOptions>(
    () => ({
      clientSecret,
      appearance: {
        theme: "stripe",
        variables: {
          borderRadius: "0px",
          colorBackground: "#FFFFFF",
          colorDanger: "#C1440E",
          colorPrimary: "#0A0A0A",
          colorText: "#0A0A0A",
          colorTextSecondary: "#6F6A64",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSizeBase: "16px",
          spacingUnit: "4px",
        },
        rules: {
          ".Input": {
            border: "1px solid #D5D2CC",
            boxShadow: "none",
          },
          ".Input:focus": {
            border: "1px solid #0A0A0A",
            boxShadow: "0 0 0 2px rgba(10, 10, 10, 0.06)",
          },
        },
      },
    }),
    [clientSecret]
  )

  useEffect(() => {
    let active = true

    async function verifyPaymentSession() {
      if (!stripePromise || !clientSecret) {
        return
      }

      const stripe = await stripePromise
      if (!stripe || !active) {
        return
      }

      const result = await stripe.retrievePaymentIntent(clientSecret)
      if (!active) {
        return
      }

      if (!result.error) {
        setSessionState("ready")
        return
      }

      const message = result.error.message?.toLowerCase() ?? ""
      const isAccountMismatch =
        message.includes("does not match any associated paymentintent") ||
        message.includes("same account that created the paymentintent")

      if (!isAccountMismatch) {
        setSessionError(
          result.error.message ?? "Stripe could not load this payment session."
        )
        setSessionState("error")
        return
      }

      setSessionState("recovering")
      try {
        await refreshPaymentSession(
          cart,
          paymentSession.id,
          paymentSession.provider_id
        )
        if (active) {
          router.refresh()
        }
      } catch (error) {
        if (active) {
          setSessionError(
            error instanceof Error
              ? error.message
              : "Stripe could not refresh this payment session."
          )
          setSessionState("error")
        }
      }
    }

    verifyPaymentSession()

    return () => {
      active = false
    }
  }, [cart, clientSecret, paymentSession.id, paymentSession.provider_id, router, stripePromise])

  if (!stripeKey) {
    throw new Error(
      "Stripe key is missing. Set NEXT_PUBLIC_STRIPE_KEY environment variable."
    )
  }

  if (!stripePromise) {
    throw new Error(
      "Stripe promise is missing. Make sure you have provided a valid Stripe key."
    )
  }

  if (!clientSecret) {
    throw new Error(
      "Stripe client secret is missing. Cannot initialize Stripe."
    )
  }

  if (sessionState === "checking" || sessionState === "recovering") {
    return (
      <div className="py-8 text-center text-sm text-ui-fg-subtle">
        {sessionState === "recovering"
          ? "Refreshing secure payment…"
          : "Loading secure payment…"}
      </div>
    )
  }

  if (sessionState === "error") {
    return (
      <div className="py-8 text-center text-sm text-ui-fg-error">
        {sessionError}
      </div>
    )
  }

  return (
    <StripeContext.Provider value={true}>
      <Elements options={options} stripe={stripePromise}>
        {children}
      </Elements>
    </StripeContext.Provider>
  )
}

export default StripeWrapper
