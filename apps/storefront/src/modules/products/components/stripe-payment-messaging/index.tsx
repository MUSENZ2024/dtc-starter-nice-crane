"use client"

import { Elements, PaymentMethodMessagingElement } from "@stripe/react-stripe-js"
import { loadStripe, type Stripe } from "@stripe/stripe-js"
import type { StripeElementsOptions } from "@stripe/stripe-js"
import { useEffect, useMemo, useRef, useState } from "react"

type StripePaymentMessagingProps = {
  amount: number
  currency: string
  countryCode: string
}

const stripeKey =
  process.env.NEXT_PUBLIC_STRIPE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY

const medusaAccountId = process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID

// Loading Stripe.js here pulls in Stripe's fraud-detection bundle (which in
// turn loads an hCaptcha challenge script that has been observed burning
// 20s+ of main-thread CPU time). This widget is just a promotional line of
// text ("or 4x interest-free payments with Afterpay"), so we must not pay
// that cost during initial page load on every product page. `loadStripe` is
// only invoked lazily, once the widget is actually visible and the browser
// is idle — see `useDeferredStripe` below.
let stripePromiseSingleton: Promise<Stripe | null> | null = null
function getStripe(): Promise<Stripe | null> | null {
  if (!stripeKey) return null
  if (!stripePromiseSingleton) {
    stripePromiseSingleton = loadStripe(
      stripeKey,
      medusaAccountId ? { stripeAccount: medusaAccountId } : undefined
    )
  }
  return stripePromiseSingleton
}

function useDeferredStripe(enabled: boolean) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(
    null
  )
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled || stripePromise) return

    let cancelled = false
    let idleHandle: number | undefined
    const win = window as typeof window & {
      requestIdleCallback?: (cb: () => void) => number
      cancelIdleCallback?: (handle: number) => void
    }

    const load = () => {
      if (cancelled) return
      const promise = getStripe()
      if (promise) setStripePromise(promise)
    }

    const scheduleIdleLoad = () => {
      if (win.requestIdleCallback) {
        idleHandle = win.requestIdleCallback(load)
      } else {
        idleHandle = window.setTimeout(load, 1500) as unknown as number
      }
    }

    const node = containerRef.current
    if (!node || typeof IntersectionObserver === "undefined") {
      scheduleIdleLoad()
      return () => {
        cancelled = true
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          scheduleIdleLoad()
          observer.disconnect()
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(node)

    return () => {
      cancelled = true
      observer.disconnect()
      if (idleHandle !== undefined) {
        if (win.cancelIdleCallback) win.cancelIdleCallback(idleHandle)
        else window.clearTimeout(idleHandle)
      }
    }
  }, [enabled, stripePromise])

  return { stripePromise, containerRef }
}

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

  const { stripePromise, containerRef } = useDeferredStripe(!!stripeKey)

  if (!stripePromise) {
    return (
      <div ref={containerRef} className="text-[13px] text-[#666]">
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
