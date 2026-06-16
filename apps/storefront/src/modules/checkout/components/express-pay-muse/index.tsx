"use client"

import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import { StripeContext } from "@modules/checkout/components/payment-wrapper/stripe-wrapper"
import { ExpressCheckoutElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { useContext, useState } from "react"

export default function ExpressPayMuse({ cart }: { cart: HttpTypes.StoreCart }) {
  const hasStripeProvider = useContext(StripeContext)
  const hasStripeSession = Boolean(
    cart.payment_collection?.payment_sessions?.some(
      (session) => session.status === "pending" && session.data?.client_secret
    )
  )

  if (hasStripeProvider && hasStripeSession) {
    return <ExpressPayStripe />
  }

  return (
    <section>
      <p className="mb-3.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-muse-text-light">
        Express checkout
      </p>
      <ExpressCheckoutFallback />
    </section>
  )
}

function ExpressPayStripe() {
  const stripe = useStripe()
  const elements = useElements()
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
            },
          }}
          onReady={(event) => {
            setError(null)
            setIsReady(Boolean(event.availablePaymentMethods))
          }}
          onLoadError={(event) => {
            setError(
              event.error?.message ||
                "Express checkout is unavailable in this browser. Continue with the payment methods below."
            )
            setIsReady(false)
          }}
          onConfirm={async () => {
            setError(null)

            if (!stripe || !elements) {
              setError("Stripe is still loading. Please try again.")
              return
            }

            const { error: confirmError } = await stripe.confirmPayment({
              elements,
              redirect: "if_required",
            })

            if (confirmError) {
              setError(confirmError.message || "Payment could not be confirmed.")
              return
            }

            await placeOrder().catch((err) => {
              setError(err instanceof Error ? err.message : String(err))
            })
          }}
        />
      </div>
      {!isReady && <ExpressCheckoutFallback />}
      <ErrorMessage error={error} data-testid="express-payment-error-message" />
    </section>
  )
}

function ExpressCheckoutFallback() {
  return (
    <div className="mb-2.5 grid grid-cols-2 gap-2.5 opacity-70">
      <button
        type="button"
        disabled
        className="flex items-center justify-center gap-2 rounded-2xl bg-muse-black py-3.5 text-sm font-bold text-white"
      >
        Apple Pay
      </button>
      <button
        type="button"
        disabled
        className="flex items-center justify-center gap-2 rounded-2xl border border-muse-input bg-white py-3.5 text-sm font-bold text-muse-black"
      >
        Google Pay
      </button>
      <button
        type="button"
        disabled
        className="flex items-center justify-center gap-2 rounded-2xl bg-[#B2FCE4] py-3.5 text-sm font-bold text-muse-black"
      >
        Afterpay · 4 payments
      </button>
      <button
        type="button"
        disabled
        className="flex items-center justify-center gap-2 rounded-2xl bg-[#F4ABC4] py-3.5 text-sm font-bold text-muse-black"
      >
        Klarna · Pay later
      </button>
    </div>
  )
}
