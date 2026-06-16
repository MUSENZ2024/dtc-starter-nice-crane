import { Radio as RadioGroupOption } from "@headlessui/react"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import React, { useContext, useMemo, type JSX } from "react"

import { isManual } from "@lib/constants"
import SkeletonCardDetails from "@modules/skeletons/components/skeleton-card-details"
import { PaymentElement } from "@stripe/react-stripe-js"
import { StripePaymentElementOptions } from "@stripe/stripe-js"
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
  cart,
  setError,
  setPaymentComplete,
}: Omit<PaymentContainerProps, "children"> & {
  cart: HttpTypes.StoreCart
  setError: (error: string | null) => void
  setPaymentComplete: (complete: boolean) => void
}) => {
  const stripeReady = useContext(StripeContext)
  const billingAddress = cart.billing_address ?? cart.shipping_address
  const billingName = [
    billingAddress?.first_name,
    billingAddress?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
  const countryCode = (
    billingAddress?.country_code ??
    cart.shipping_address?.country_code ??
    "nz"
  ).toUpperCase()

  const useOptions: StripePaymentElementOptions = useMemo(() => {
    return {
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
            country: countryCode,
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
      paymentMethodOrder: ["card", "afterpay_clearpay", "klarna", "link"],
    }
  }, [billingAddress, billingName, cart.email, countryCode])

  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      paymentInfoMap={paymentInfoMap}
      disabled={disabled}
    >
      {selectedPaymentOptionId === paymentProviderId &&
        (stripeReady ? (
          <PaymentElement
            options={useOptions}
            onChange={(e) => {
              setError(null)
              setPaymentComplete(e.complete)
            }}
            onLoadError={(event) => {
              setError(
                event.error?.message ||
                  "Stripe payment methods could not load. Refresh the page or choose another payment method."
              )
              setPaymentComplete(false)
            }}
          />
        ) : (
          <SkeletonCardDetails />
        ))}
    </PaymentContainer>
  )
}
