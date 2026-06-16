"use client"

import { FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { applyPromotions } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import PaymentBadges from "@modules/common/components/payment-badges"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const FREE_SHIPPING_THRESHOLD = 200

type Props = {
  cart: HttpTypes.StoreCart
}

const getCheckoutStep = (cart: HttpTypes.StoreCart) => {
  if (!cart.shipping_address?.address_1 || !cart.email) return "address"
  if (!cart.shipping_methods?.length) return "delivery"
  return "payment"
}

export default function CartSummaryMuse({ cart }: Props) {
  const router = useRouter()
  const [discountOpen, setDiscountOpen] = useState(false)
  const [discountCode, setDiscountCode] = useState("")
  const [isPending, startTransition] = useTransition()
  const subtotal = cart.subtotal ?? cart.item_subtotal ?? 0
  const shippingFree = subtotal >= FREE_SHIPPING_THRESHOLD
  const shippingTotal = cart.shipping_total ?? 0
  const total = cart.total ?? subtotal + shippingTotal
  const step = getCheckoutStep(cart)

  const formatMoney = (amount: number) =>
    convertToLocale({
      amount,
      currency_code: cart.currency_code ?? "nzd",
    })

  function handleApplyDiscount(event: FormEvent) {
    event.preventDefault()

    if (!discountCode.trim()) return

    startTransition(async () => {
      await applyPromotions([discountCode.trim()])
      setDiscountOpen(false)
      setDiscountCode("")
      router.refresh()
    })
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-muse-border bg-muse-cream-warm">
      <div className="p-6">
        <p className="mb-5 text-[13px] font-extrabold uppercase tracking-[0.12em] text-muse-text-muted">
          Order summary
        </p>

        <div className="mb-[18px]">
          <p className="text-[12.5px] text-muse-text-muted">
            Have a discount code?{" "}
            <button
              type="button"
              onClick={() => setDiscountOpen((value) => !value)}
              className="border-b border-dashed border-muse-input font-bold text-muse-black"
            >
              Enter it here
            </button>
          </p>
          {discountOpen && (
            <form onSubmit={handleApplyDiscount} className="mt-2.5 flex gap-2">
              <input
                type="text"
                value={discountCode}
                onChange={(event) =>
                  setDiscountCode(event.target.value.toUpperCase())
                }
                placeholder="Discount code"
                maxLength={24}
                className="flex-1 rounded-full border border-muse-input bg-white px-[14px] py-[11px] font-inter text-[12.5px] uppercase tracking-[0.04em] outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-[#bbb] focus:border-muse-black"
              />
              <button
                type="submit"
                disabled={isPending}
                className="whitespace-nowrap rounded-full bg-muse-black px-4 py-[11px] text-[11.5px] font-bold uppercase tracking-[0.06em] text-muse-cream transition hover:bg-muse-orange disabled:opacity-50"
              >
                Apply
              </button>
            </form>
          )}
        </div>

        <div className="mb-[18px] flex flex-col gap-[11px] border-t border-muse-border pt-[18px]">
          <div className="flex items-center justify-between text-[13.5px] text-muse-text-muted">
            <span>Subtotal</span>
            <span className="font-semibold text-muse-black">
              {formatMoney(subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[13.5px] text-muse-text-muted">
            <span>Shipping</span>
            <span
              className={`font-semibold ${
                shippingFree ? "text-muse-green" : "text-muse-black"
              }`}
            >
              {shippingFree ? "Free" : formatMoney(shippingTotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[13.5px] text-muse-text-muted">
            <span>GST (15%)</span>
            <span className="font-semibold text-muse-black">Included</span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-muse-border pt-3.5 text-[18px] font-black text-muse-black">
            <span>Total</span>
            <span className="text-[22px] tracking-tight">
              {formatMoney(total)}
            </span>
          </div>
        </div>

        <p className="-mt-3 mb-[18px] text-[11.5px] text-muse-text-light">
          All prices include GST · No surprise fees
        </p>

        <LocalizedClientLink
          href={`/checkout?step=${step}`}
          className="mb-2.5 flex w-full items-center justify-center gap-2.5 rounded-full bg-muse-black px-6 py-[18px] text-[14px] font-extrabold uppercase tracking-[0.08em] text-muse-cream transition hover:-translate-y-px hover:bg-muse-orange"
        >
          Go to checkout →
        </LocalizedClientLink>

        <PaymentBadges className="mb-4" />
      </div>

      <div className="flex flex-col gap-[9px] border-t border-muse-border bg-muse-cream px-6 py-[18px]">
        <TrustItem icon="shield">
          30-day money back — full refund + return shipping
        </TrustItem>
        <TrustItem icon="pin">Inspected before dispatch from Auckland</TrustItem>
        <TrustItem icon="lock">Stripe SSL · PCI DSS secured</TrustItem>
        <TrustItem icon="card">MUSE NZ · Auckland</TrustItem>

        <p className="mt-[2px] border-t border-muse-border pt-2.5 text-[12px] text-muse-text-muted">
          Questions before checkout? Email support@musenz.com.
        </p>
      </div>
    </div>
  )
}

function TrustItem({
  children,
  icon,
}: {
  children: React.ReactNode
  icon: "shield" | "pin" | "lock" | "card"
}) {
  return (
    <div className="flex items-center gap-[9px] text-[12px] text-muse-text-muted">
      <svg
        className="h-[14px] w-[14px] flex-shrink-0 stroke-muse-green"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2.5"
      >
        {icon === "shield" && (
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        )}
        {icon === "pin" && (
          <>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
            <circle cx="12" cy="10" r="3" />
          </>
        )}
        {icon === "lock" && (
          <>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </>
        )}
        {icon === "card" && (
          <>
            <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="1" />
          </>
        )}
      </svg>
      <span>{children}</span>
    </div>
  )
}
