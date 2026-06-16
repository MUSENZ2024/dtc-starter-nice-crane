"use client"

import { applyPromotions } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { getShippingProtectionItem } from "@modules/checkout/components/step-delivery"
import { useRouter } from "next/navigation"
import { FormEvent, useState, useTransition } from "react"

type Props = {
  cart: HttpTypes.StoreCart
  compact?: boolean
  shippingProtectionSelected?: boolean
}

const FREE_SHIPPING_THRESHOLD = 200
function money(cart: HttpTypes.StoreCart, amount: number) {
  return convertToLocale({ amount, currency_code: cart.currency_code })
}

export default function CheckoutSummaryMuse({
  cart,
  compact,
  shippingProtectionSelected = false,
}: Props) {
  const subtotal = cart.subtotal ?? cart.item_subtotal ?? 0
  const shippingProtectionItem = getShippingProtectionItem(cart)
  const items = cart.items?.filter((item) => item.id !== shippingProtectionItem?.id)
  const protectionAmount = shippingProtectionItem
    ? (shippingProtectionItem.unit_price ?? 0) * shippingProtectionItem.quantity
    : 0
  const displayTotal = cart.total ?? 0
  const discountTotal = cart.discount_total ?? 0
  const [code, setCode] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDiscount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextCode = code.trim()

    if (!nextCode) {
      return
    }

    startTransition(async () => {
      await applyPromotions([nextCode])
      setCode("")
      router.refresh()
    })
  }

  return (
    <aside className={`overflow-hidden rounded-3xl border border-muse-border bg-muse-cream-warm ${compact ? "" : "shadow-sm"}`}>
      <div className="p-5 small:p-6">
        <p className="mb-5 text-[14px] font-extrabold uppercase tracking-widest text-muse-text-muted">
          Order summary
        </p>

        <div className="mb-5 flex flex-col gap-4">
          {items?.map((item) => (
            <div key={item.id} className="flex items-center gap-3.5">
              <div className="relative flex h-[60px] w-[60px] flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-muse-cream-deep to-muse-cream-warm">
                {item.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
                )}
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-muse-text-muted text-[10px] font-extrabold text-white">
                  {item.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-muse-black">
                  {item.product_title}
                </p>
                <p className="text-[11.5px] text-muse-text-muted">
                  {item.variant?.title}
                </p>
                {item.quantity > 1 && (
                  <p className="text-[11.5px] text-muse-text-light">
                    {money(cart, item.unit_price ?? 0)} each
                  </p>
                )}
              </div>
              <p className="whitespace-nowrap text-[14px] font-extrabold">
                {money(cart, (item.unit_price ?? 0) * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-4 rounded-2xl border border-muse-border bg-white px-4 py-3.5">
          {subtotal >= FREE_SHIPPING_THRESHOLD ? (
            <p className="mb-2 text-[12px] text-muse-text">
              <strong className="text-muse-green">Free NZ delivery unlocked</strong>
            </p>
          ) : (
            <p className="mb-2 text-[12px] text-muse-text">
              Add <strong>{money(cart, FREE_SHIPPING_THRESHOLD - subtotal)}</strong> for free NZ delivery
            </p>
          )}
          <div className="h-1.5 overflow-hidden rounded-full bg-muse-border">
            <div
              className="h-full rounded-full bg-muse-green"
              style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
            />
          </div>
        </div>

        <details className="mb-4">
          <summary className="cursor-pointer text-[12.5px] text-muse-text-muted">
            Have a discount code?{" "}
            <strong className="border-b border-dashed border-muse-input text-muse-black">
              Enter it here
            </strong>
          </summary>
          <form className="mt-2.5 flex gap-2" onSubmit={handleDiscount}>
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Discount code"
              className="min-w-0 flex-1 rounded-full border border-muse-input bg-white px-4 py-3 text-[12.5px] uppercase tracking-wider outline-none transition placeholder:normal-case placeholder:tracking-normal focus:border-muse-black"
            />
            <button
              type="submit"
              disabled={isPending}
              className="whitespace-nowrap rounded-full bg-muse-black px-4 py-3 text-xs font-bold uppercase tracking-wider text-muse-cream transition hover:bg-muse-orange disabled:opacity-50"
            >
              Apply
            </button>
          </form>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muse-text-light">
            Codes are applied before payment and reflected in the total below.
          </p>
        </details>

        <div>
          <div className="flex flex-col gap-y-2 text-[13px] text-muse-text-muted">
            <div className="flex items-center justify-between">
              <span>Subtotal (excl. shipping and taxes)</span>
              <span>{money(cart, cart.item_subtotal ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span>
                {cart.shipping_methods?.length
                  ? money(cart, cart.shipping_subtotal ?? 0)
                  : "Calculated after address"}
              </span>
            </div>
            {(shippingProtectionSelected || shippingProtectionItem) && (
              <div className="flex items-center justify-between">
                <span>Shipping protection</span>
                <span>{money(cart, protectionAmount)}</span>
              </div>
            )}
            {!!discountTotal && (
              <div className="flex items-center justify-between">
                <span>Discount</span>
                <span className="text-muse-green">
                  -{money(cart, discountTotal)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>Taxes</span>
              <span>{money(cart, cart.tax_total ?? 0)}</span>
            </div>
          </div>
          <div className="my-4 h-px w-full bg-muse-border" />
          <div className="mb-2 flex items-center justify-between text-muse-black">
            <span className="text-[15px]">Total</span>
            <span className="text-[22px] font-black tracking-tight">
              {money(cart, displayTotal)}
            </span>
          </div>
          {!cart.shipping_methods?.length && (
            <p className="text-[11.5px] leading-relaxed text-muse-text-light">
              Estimated total. Shipping and final tax update after your address
              and delivery method are selected.
            </p>
          )}
          <div className="mt-4 h-px w-full bg-muse-border" />
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-muse-border bg-muse-cream px-5 py-4 small:px-6">
        {[
          "30-day money back, including return support",
          "Inspected before dispatch from Auckland",
          "Stripe SSL and PCI DSS secured",
          "MUSE NZ · Auckland, New Zealand",
        ].map((text) => (
          <div key={text} className="flex items-start gap-2 text-[12px] text-muse-text-muted">
            <span className="font-bold text-muse-green">✓</span>
            <span>{text}</span>
          </div>
        ))}

        <div className="mt-1 flex items-center gap-2 border-t border-muse-border pt-2">
          <span className="text-sm tracking-wide text-muse-orange">★★★★★</span>
          <span className="text-[12px] text-muse-text-muted">
            <strong className="text-muse-black">4.9</strong> from verified reviews
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11.5px] text-muse-text-muted">
          <span className="inline-block h-[7px] w-[7px] animate-pulse-dot rounded-full bg-muse-green" />
          Recent orders from Auckland and Wellington
        </div>
      </div>
    </aside>
  )
}
