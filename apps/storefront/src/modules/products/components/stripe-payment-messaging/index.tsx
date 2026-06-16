"use client"

import { Elements, PaymentMethodMessagingElement } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import type { StripeElementsOptions } from "@stripe/stripe-js"
import { useMemo } from "react"

type StripePaymentMessagingProps = {
  amount: number
  currency: string
  countryCode: string
}

const stripeKey =
  process.env.NEXT_PUBLIC_STRIPE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY

const medusaAccountId = process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID
const stripePromise = stripeKey
  ? loadStripe(
      stripeKey,
      medusaAccountId ? { stripeAccount: medusaAccountId } : undefined
    )
  : null

type MessagingCurrency =
  | "AUD"
  | "CAD"
  | "CHF"
  | "CZK"
  | "DKK"
  | "EUR"
  | "GBP"
  | "NOK"
  | "NZD"
  | "PLN"
  | "SEK"
  | "USD"

type MessagingCountry =
  | "AT"
  | "AU"
  | "BE"
  | "CA"
  | "CH"
  | "CZ"
  | "DE"
  | "DK"
  | "ES"
  | "FI"
  | "FR"
  | "GB"
  | "GR"
  | "IE"
  | "IT"
  | "NL"
  | "NO"
  | "NZ"
  | "PL"
  | "PT"
  | "RO"
  | "SE"
  | "US"

const messagingCurrencies = new Set<MessagingCurrency>([
  "AUD",
  "CAD",
  "CHF",
  "CZK",
  "DKK",
  "EUR",
  "GBP",
  "NOK",
  "NZD",
  "PLN",
  "SEK",
  "USD",
])

const messagingCountries = new Set<MessagingCountry>([
  "AT",
  "AU",
  "BE",
  "CA",
  "CH",
  "CZ",
  "DE",
  "DK",
  "ES",
  "FI",
  "FR",
  "GB",
  "GR",
  "IE",
  "IT",
  "NL",
  "NO",
  "NZ",
  "PL",
  "PT",
  "RO",
  "SE",
  "US",
])

export default function StripePaymentMessaging({
  amount,
  currency,
  countryCode,
}: StripePaymentMessagingProps) {
  const roundedAmount = Math.max(1, Math.round(amount * 100))
  const uppercaseCurrency = (currency || "NZD").toUpperCase()
  const normalizedCurrency: MessagingCurrency = messagingCurrencies.has(
    uppercaseCurrency as MessagingCurrency
  )
    ? (uppercaseCurrency as MessagingCurrency)
    : "NZD"

  const uppercaseCountry = (countryCode || "NZ").toUpperCase()
  const normalizedCountry: MessagingCountry = messagingCountries.has(
    uppercaseCountry as MessagingCountry
  )
    ? (uppercaseCountry as MessagingCountry)
    : "NZ"

  const options = useMemo<StripeElementsOptions>(
    () => ({
      mode: "payment",
      amount: roundedAmount,
      currency: normalizedCurrency.toLowerCase(),
      appearance: {
        variables: {
          colorText: "#0A0A0A",
          colorTextSecondary: "#666666",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSizeBase: "14px",
          fontWeightMedium: "700",
        },
        rules: {
          ".PaymentMethodMessaging": {
            textAlign: "left",
          },
        },
      },
    }),
    [normalizedCurrency, roundedAmount]
  )

  if (!stripePromise) {
    return (
      <div className="text-[13px] text-[#666]">
        or 4x <strong className="font-bold text-[#0A0A0A]">interest-free</strong>{" "}
        payments with <strong className="font-bold text-[#0A0A0A]">Afterpay</strong>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <div className="min-h-6 text-[13px] text-[#666]">
        <PaymentMethodMessagingElement
          options={{
            amount: roundedAmount,
            currency: normalizedCurrency,
            countryCode: normalizedCountry,
            paymentMethodTypes: ["afterpay_clearpay", "klarna"],
          }}
        />
      </div>
    </Elements>
  )
}
