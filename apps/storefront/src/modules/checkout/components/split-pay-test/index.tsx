"use client"

import {
  formatSplitPayMoney,
  getCartTotalCents,
  getSplitPayInstallments,
} from "@lib/split-pay"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { StripeElementsOptions, StripePaymentElementOptions } from "@stripe/stripe-js"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"

type Props = {
  cart: HttpTypes.StoreCart
}

type SetupIntentResponse = {
  clientSecret?: string
  setupIntentId?: string
  countryCode?: string
  error?: string
}

const stripeKey =
  process.env.NEXT_PUBLIC_STRIPE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY

const stripePromise = stripeKey ? loadStripe(stripeKey) : null

export default function SplitPayTest({ cart }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [setupState, setSetupState] = useState<SetupIntentResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const splitPayError = searchParams.get("split_pay_error")
  const totalCents = getCartTotalCents(cart)
  const { installments } = getSplitPayInstallments(totalCents)
  const paymentGroups = getPaymentGroups(installments)
  const currency = cart.currency_code || "nzd"

  const disabled =
    !cart.email ||
    !cart.shipping_address ||
    !cart.billing_address ||
    (cart.shipping_methods?.length ?? 0) < 1 ||
    totalCents < 4

  const elementsOptions: StripeElementsOptions | undefined = useMemo(() => {
    if (!setupState?.clientSecret) {
      return undefined
    }

    return {
      clientSecret: setupState.clientSecret,
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
  }, [setupState?.clientSecret])

  const startSplitPay = async () => {
    if (setupState?.clientSecret) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/split-pay/create-setup-intent", {
        method: "POST",
      })
      const result = (await response.json()) as SetupIntentResponse

      if (!response.ok || !result.clientSecret || !result.setupIntentId) {
        throw new Error(result.error || "Unable to start Split Pay.")
      }

      setSetupState(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-muse-border bg-muse-cream-warm p-4">
      <div className="mb-3 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-[15px] font-black text-muse-black">
            MUSE Split Pay
          </h3>
          <span className="rounded-full bg-white px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-muse-text-muted">
            Test
          </span>
        </div>
        <p className="text-[12.5px] leading-5 text-muse-text-muted">
          Pay over 4 weekly card payments. Your order ships once paid in full.
        </p>
      </div>

      <div className="mb-4 rounded-xl bg-white px-3 py-3 text-[12.5px]">
        <span className="block text-muse-text-light">Payment plan</span>
        <strong className="block text-muse-black">
          {paymentGroups.map((group, index) => (
            <span key={`${group.amount}-${group.count}`}>
              {index > 0 ? ", then " : ""}
              {group.count} {group.count === 1 ? "payment" : "payments"} of{" "}
              {formatSplitPayMoney(group.amount, currency)}
            </span>
          ))}
        </strong>
        {paymentGroups.length > 1 && (
          <span className="mt-1 block text-[11.5px] leading-5 text-muse-text-muted">
            Totals that cannot divide evenly into cents are balanced across the
            payments.
          </span>
        )}
      </div>

      {!setupState?.clientSecret && (
        <Button
          type="button"
          size="large"
          className="w-full rounded-full text-[13px] font-extrabold uppercase tracking-[0.08em]"
          onClick={startSplitPay}
          disabled={disabled || !stripePromise}
          isLoading={isLoading}
        >
          Split payment
        </Button>
      )}

      {setupState?.clientSecret && elementsOptions && stripePromise && (
        <Elements stripe={stripePromise} options={elementsOptions}>
          <SplitPaySetupForm
            cart={cart}
            setupIntentId={setupState.setupIntentId!}
            countryCode={setupState.countryCode || "nz"}
            onError={setError}
          />
        </Elements>
      )}

      {(error || splitPayError) && (
        <p className="mt-3 text-[12px] leading-5 text-red-600">
          {error || splitPayError}
        </p>
      )}

      {disabled && (
        <p className="mt-3 text-[11.5px] leading-5 text-muse-text-light">
          Add contact, shipping, billing, and delivery details first.
        </p>
      )}
    </div>
  )
}

function SplitPaySetupForm({
  cart,
  setupIntentId,
  countryCode,
  onError,
}: {
  cart: HttpTypes.StoreCart
  setupIntentId: string
  countryCode: string
  onError: (error: string | null) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const billingAddress = cart.billing_address ?? cart.shipping_address
  const billingName = [
    billingAddress?.first_name,
    billingAddress?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
  const billingCountry = (
    billingAddress?.country_code ??
    cart.shipping_address?.country_code ??
    "nz"
  ).toUpperCase()

  const paymentElementOptions: StripePaymentElementOptions = useMemo(
    () => ({
      defaultValues: {
        billingDetails: {
          name: billingName || undefined,
          email: cart.email || undefined,
          phone: billingAddress?.phone || undefined,
          address: {
            line1: billingAddress?.address_1 || undefined,
            line2: billingAddress?.address_2 || undefined,
            city: billingAddress?.city || undefined,
            state: billingAddress?.province || undefined,
            postal_code: billingAddress?.postal_code || undefined,
            country: billingCountry,
          },
        },
      },
      fields: {
        billingDetails: {
          address: "never",
        },
      },
      layout: {
        type: "tabs",
      },
      paymentMethodOrder: ["card", "link"],
    }),
    [billingAddress, billingCountry, billingName, cart.email]
  )

  const confirmSplitPay = async () => {
    if (!stripe || !elements) {
      return
    }

    setIsSubmitting(true)
    onError(null)

    const { error: submitError } = await elements.submit()

    if (submitError) {
      onError(submitError.message || "Please check your card details.")
      setIsSubmitting(false)
      return
    }

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${countryCode}/checkout?step=payment&muse_step=payment`,
        payment_method_data: {
          billing_details: {
            name: billingName || undefined,
            email: cart.email || undefined,
            phone: billingAddress?.phone || undefined,
            address: {
              city: billingAddress?.city ?? undefined,
              country: billingCountry,
              line1: billingAddress?.address_1 ?? undefined,
              line2: billingAddress?.address_2 ?? undefined,
              postal_code: billingAddress?.postal_code ?? undefined,
              state: billingAddress?.province ?? undefined,
            },
          },
        },
      },
      redirect: "if_required",
    })

    if (error) {
      onError(error.message || "Split Pay setup failed.")
      setIsSubmitting(false)
      return
    }

    const completedSetupIntentId = setupIntent?.id || setupIntentId
    const response = await fetch("/api/split-pay/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        setup_intent_id: completedSetupIntentId,
        country_code: countryCode,
      }),
    })
    const result = (await response.json()) as { url?: string; error?: string }

    if (!response.ok || !result.url) {
      onError(result.error || "Split Pay setup failed.")
      setIsSubmitting(false)
      return
    }

    router.push(result.url)
  }

  return (
    <div className="mt-4 rounded-2xl border border-muse-border bg-white p-4">
      <PaymentElement
        options={paymentElementOptions}
        onChange={(event) => {
          onError(null)
          setPaymentComplete(event.complete)
        }}
        onLoadError={(event) => {
          onError(
            event.error?.message ||
              "Stripe payment methods could not load. Refresh and try again."
          )
          setPaymentComplete(false)
        }}
      />
      <Button
        type="button"
        size="large"
        className="mt-4 w-full rounded-full text-[13px] font-extrabold uppercase tracking-[0.08em]"
        onClick={confirmSplitPay}
        disabled={!stripe || !elements || !paymentComplete}
        isLoading={isSubmitting}
      >
        Confirm MUSE Split Payment
      </Button>
    </div>
  )
}

function getPaymentGroups(installments: number[]) {
  return installments.reduce<Array<{ amount: number; count: number }>>(
    (groups, amount) => {
      const current = groups[groups.length - 1]

      if (current?.amount === amount) {
        current.count += 1
        return groups
      }

      return [...groups, { amount, count: 1 }]
    },
    []
  )
}
