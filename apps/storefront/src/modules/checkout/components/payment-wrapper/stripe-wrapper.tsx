"use client"

import { Stripe, StripeElementsOptions } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { HttpTypes } from "@medusajs/types"
import { createContext } from "react"

type StripeWrapperProps = {
  paymentSession: HttpTypes.StorePaymentSession
  stripeKey?: string
  stripePromise: Promise<Stripe | null> | null
  children: React.ReactNode
}

export const StripeContext = createContext(false)

const StripeWrapper: React.FC<StripeWrapperProps> = ({
  paymentSession,
  stripeKey,
  stripePromise,
  children,
}) => {
  const options: StripeElementsOptions = {
    clientSecret: paymentSession!.data?.client_secret as string | undefined,
    appearance: {
      theme: "stripe",
      variables: {
        borderRadius: "14px",
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
  }

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

  if (!paymentSession?.data?.client_secret) {
    throw new Error(
      "Stripe client secret is missing. Cannot initialize Stripe."
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
