import { Radio as RadioGroupOption } from "@headlessui/react"
import { clx } from "@modules/common/components/ui"
import React, { useContext, useMemo, type JSX } from "react"

import { isManual } from "@lib/constants"
import SkeletonCardDetails from "@modules/skeletons/components/skeleton-card-details"
import { CardElement } from "@stripe/react-stripe-js"
import { StripeCardElementOptions } from "@stripe/stripe-js"
import PaymentTest from "../payment-test"
import { StripeContext } from "../payment-wrapper/stripe-wrapper"

type PaymentContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
  paymentInfoMap: Record<string, { title: string; icon: JSX.Element }>
  children?: React.ReactNode
}

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  children,
}) => {
  const isDevelopment = process.env.NODE_ENV === "development"
  const isSelected = selectedPaymentOptionId === paymentProviderId

  return (
    <RadioGroupOption
      key={paymentProviderId}
      value={paymentProviderId}
      disabled={disabled}
      className={clx(
        "mb-3 flex cursor-pointer flex-col gap-4 rounded-2xl border bg-white p-4 text-left transition",
        isSelected
          ? "border-muse-black shadow-[0_1px_10px_rgba(0,0,0,0.04)]"
          : "border-muse-input hover:border-muse-black",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <span
            className={clx(
              "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2",
              isSelected ? "border-muse-black" : "border-muse-input"
            )}
          >
            {isSelected && (
              <span className="block h-2.5 w-2.5 rounded-full bg-muse-black" />
            )}
          </span>
          <span className="text-[14px] font-bold text-muse-black">
            {paymentInfoMap[paymentProviderId]?.title || paymentProviderId}
          </span>
          {isManual(paymentProviderId) && isDevelopment && (
            <PaymentTest className="hidden small:block" />
          )}
        </div>
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-muse-input bg-muse-cream-warm text-muse-text-muted">
          {paymentInfoMap[paymentProviderId]?.icon}
        </span>
      </div>
      {isManual(paymentProviderId) && isDevelopment && (
        <PaymentTest className="small:hidden text-[10px]" />
      )}
      {children}
    </RadioGroupOption>
  )
}

export default PaymentContainer

export const StripeCardContainer = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  setCardBrand,
  setError,
  setCardComplete,
}: Omit<PaymentContainerProps, "children"> & {
  setCardBrand: (brand: string) => void
  setError: (error: string | null) => void
  setCardComplete: (complete: boolean) => void
}) => {
  const stripeReady = useContext(StripeContext)

  const useOptions: StripeCardElementOptions = useMemo(() => {
    return {
      style: {
        base: {
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "14px",
          fontWeight: "500",
          color: "#111111",
          iconColor: "#6f6a64",
          "::placeholder": {
            color: "#9b978f",
          },
        },
        invalid: {
          color: "#C1440E",
          iconColor: "#C1440E",
        },
      },
      classes: {
        base: "block w-full rounded-xl border border-muse-input bg-white px-4 py-4 transition focus:border-muse-black focus:ring-2 focus:ring-black/5",
        focus: "border-muse-black ring-2 ring-black/5",
        invalid: "border-muse-orange bg-muse-orange-soft",
      },
    }
  }, [])

  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      paymentInfoMap={paymentInfoMap}
      disabled={disabled}
    >
      {selectedPaymentOptionId === paymentProviderId &&
        (stripeReady ? (
          <div className="rounded-2xl border border-muse-border bg-muse-cream-warm p-4 transition-all duration-150 ease-in-out">
            <label className="mb-2 block text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-muse-text-muted">
              Card details
            </label>
            <CardElement
              options={useOptions as StripeCardElementOptions}
              onChange={(e) => {
                setCardBrand(
                  e.brand && e.brand.charAt(0).toUpperCase() + e.brand.slice(1)
                )
                setError(e.error?.message || null)
                setCardComplete(e.complete)
              }}
            />
            <p className="mt-3 text-[11.5px] leading-relaxed text-muse-text-light">
              Secure card processing by Stripe.
            </p>
          </div>
        ) : (
          <SkeletonCardDetails />
        ))}
    </PaymentContainer>
  )
}
