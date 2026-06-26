import {
  SPLIT_PAY_INSTALLMENTS,
  formatSplitPayMoney,
} from "@lib/split-pay"
import { retrieveOrder } from "@lib/data/orders"
import { getStripeServer } from "@lib/stripe/server"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { Metadata } from "next"
import Stripe from "stripe"

export const metadata: Metadata = {
  title: "MUSE Split Payment Confirmed | MUSE NZ",
}

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

const formatCardBrand = (brand?: unknown) =>
  typeof brand === "string" && brand.length > 0
    ? brand
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Card"

/**
 * Split Pay orders use Medusa's "pp_system_default" manual provider (see
 * apps/storefront/src/app/api/split-pay/complete/route.ts) — billing happens
 * entirely through the Stripe subscription schedule, not through Medusa's
 * payment module, so order.payment_collections never has a card brand/last4
 * to read the way the normal order-completed-template does. The schedule's
 * default_settings.default_payment_method is the actual card Stripe will
 * keep charging, so that's what gets looked up here instead. Best-effort —
 * if Stripe is unreachable or the schedule is gone, falls back to the
 * generic label rather than blocking the page.
 */
async function getSplitPayCardLabel(scheduleId?: string) {
  if (!scheduleId) {
    return null
  }

  try {
    const stripe = getStripeServer()
    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId, {
      expand: ["default_settings.default_payment_method"],
    })
    const paymentMethod = schedule.default_settings
      ?.default_payment_method as Stripe.PaymentMethod | string | null

    if (
      paymentMethod &&
      typeof paymentMethod !== "string" &&
      paymentMethod.card
    ) {
      return `${formatCardBrand(paymentMethod.card.brand)} ending ${paymentMethod.card.last4}`
    }
  } catch {
    // Best effort — fall back to the generic label below.
  }

  return null
}

export default async function SplitPayConfirmedPage({ searchParams }: Props) {
  const params = await searchParams
  const currency = getParam(params, "currency") || "nzd"
  const totalCents = Number(getParam(params, "total_cents") || 0)
  const baseCents = Number(getParam(params, "base_cents") || 0)
  const finalCents = Number(getParam(params, "final_cents") || 0)
  const displayId = getParam(params, "display_id")
  const orderId = getParam(params, "order_id")
  const order = orderId
    ? await retrieveOrder(orderId).catch(() => null)
    : null
  const items = (order?.items ?? []) as HttpTypes.StoreOrderLineItem[]
  const orderCurrency = order?.currency_code ?? currency
  const formatMoney = (amount: number | null | undefined) =>
    convertToLocale({ amount: amount ?? 0, currency_code: orderCurrency })
  // Shipping options are configured in admin with names like "NZ Stock
  // Standard" that describe the fulfillment lane, not what the customer
  // actually picked at checkout — the only two choices there are Standard
  // or Express delivery (see getDeliveryLabel in step-delivery, and the
  // same logic in order-completed-template.tsx for the normal order page).
  const shippingMethodName = (
    order?.shipping_methods?.[0] as { name?: string } | undefined
  )?.name
  const shippingMethod = shippingMethodName?.toLowerCase().includes("express")
    ? "Express Delivery"
    : "Standard Delivery"
  const address = order?.shipping_address
  const ADDRESS_COMPARE_KEYS = [
    "first_name",
    "last_name",
    "address_1",
    "address_2",
    "city",
    "province",
    "postal_code",
    "country_code",
  ] as const
  const billingAddress =
    order?.billing_address &&
    !ADDRESS_COMPARE_KEYS.every(
      (key) =>
        (order?.shipping_address?.[key] || "") ===
        (order?.billing_address?.[key] || "")
    )
      ? order.billing_address
      : null
  const scheduleId = getParam(params, "schedule_id")
  const cardLabel = await getSplitPayCardLabel(scheduleId)

  const today = new Date()
  const installmentDates = Array.from(
    { length: SPLIT_PAY_INSTALLMENTS },
    (_, index) => {
      const date = new Date(today)
      date.setDate(date.getDate() + index * 7)
      return date
    }
  )
  const dateFormatter = new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
  })

  return (
    <main className="min-h-screen bg-muse-cream font-inter text-muse-black">
      <header className="sticky top-0 z-50 flex h-[60px] items-center justify-between bg-muse-black px-[18px] small:h-16 small:px-8">
        <LocalizedClientLink href="/" className="flex items-center">
          <img
            src="https://d3k81ch9hvuctc.cloudfront.net/company/WsZzTe/images/18ad57dd-63d9-4151-9f41-dccf70026e4c.png"
            alt="MUSE"
            className="h-7 w-auto"
          />
        </LocalizedClientLink>
        <LocalizedClientLink
          href="/store"
          className="text-[12.5px] font-bold uppercase tracking-[0.1em] text-muse-cream/70 transition hover:text-muse-cream"
        >
          Continue shopping
        </LocalizedClientLink>
      </header>

      <section className="bg-muse-black px-[18px] py-10 text-center small:px-8 small:py-12">
        <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-muse-green">
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-muse-yellow">
          {displayId ? `Order #${displayId} · Order confirmation` : "Order confirmation"}
        </p>
        <h1 className="mx-auto mb-3 max-w-[620px] text-[clamp(30px,5vw,46px)] font-black leading-[1.05] text-muse-cream">
          MUSE Split Payment is set up.
        </h1>
        <p className="mx-auto max-w-[560px] text-[14px] leading-6 text-[#F4F2ED]/70">
          Your card has been saved securely. We will collect the payment plan
          below and ship once the final payment is complete. A confirmation
          email with your full payment schedule is on its way
          {order?.email ? (
            <>
              {" "}
              to <strong className="text-[#F4F2ED]">{order.email}</strong>
            </>
          ) : null}
          .
        </p>
      </section>

      <section className="mx-auto grid max-w-[1060px] gap-6 px-[18px] py-8 small:px-8 small:py-10 large:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {items.length > 0 && (
            <div className="rounded-[22px] border border-muse-border bg-white p-6">
              <p className="mb-4 text-[13px] font-black uppercase tracking-[0.08em] text-muse-text-muted">
                Your order
              </p>
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex gap-4 py-4 ${
                    index > 0 ? "border-t border-muse-border" : "pt-0"
                  } last:pb-0`}
                >
                  <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-muse-cream-warm">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.product_title ?? item.title ?? "Order item"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-[0.1em] text-muse-text-muted">
                        MUSE
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-black text-muse-black">
                      {item.product_title ?? item.title}
                    </p>
                    {item.variant?.title && (
                      <p className="mt-0.5 text-[12.5px] text-muse-text-muted">
                        {item.variant.title}
                      </p>
                    )}
                    <p className="mt-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-muse-text-muted">
                      Qty {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-black text-muse-black">
                      {formatMoney(item.total ?? item.unit_price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(address || shippingMethodName) && (
            <div className="rounded-[22px] border border-muse-border bg-white p-6">
              <p className="mb-4 text-[13px] font-black uppercase tracking-[0.08em] text-muse-text-muted">
                Delivery details
              </p>
              <div className="grid gap-4 small:grid-cols-2">
                {address && (
                  <div>
                    <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-muse-text-muted">
                      Delivering to
                    </p>
                    <p className="text-[13.5px] leading-[1.7] text-muse-black">
                      <strong className="font-bold">
                        {address.first_name} {address.last_name}
                      </strong>
                      <br />
                      {address.address_1}
                      {address.address_2 && <>, {address.address_2}</>}
                      <br />
                      {address.city}
                      {address.province && `, ${address.province}`}{" "}
                      {address.postal_code}
                      <br />
                      {(address.country_code ?? "nz").toUpperCase()}
                      {address.phone && (
                        <span className="mt-2 block text-muse-text-muted">
                          Phone: {address.phone}
                        </span>
                      )}
                    </p>
                  </div>
                )}
                {shippingMethodName && (
                  <div>
                    <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-muse-text-muted">
                      Shipping method
                    </p>
                    <p className="text-[13.5px] leading-[1.7] text-muse-black">
                      {shippingMethod}
                    </p>
                  </div>
                )}
              </div>
              {billingAddress && (
                <div className="mt-4 border-t border-muse-border pt-4">
                  <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-muse-text-muted">
                    Billing address
                  </p>
                  <p className="text-[13.5px] leading-[1.7] text-muse-black">
                    <strong className="font-bold">
                      {billingAddress.first_name} {billingAddress.last_name}
                    </strong>
                    <br />
                    {billingAddress.address_1}
                    {billingAddress.address_2 && <>, {billingAddress.address_2}</>}
                    <br />
                    {billingAddress.city}
                    {billingAddress.province && `, ${billingAddress.province}`}{" "}
                    {billingAddress.postal_code}
                    <br />
                    {(billingAddress.country_code ?? "nz").toUpperCase()}
                    {billingAddress.phone && (
                      <span className="mt-2 block text-muse-text-muted">
                        Phone: {billingAddress.phone}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="rounded-[22px] border border-muse-border bg-white p-6">
            <p className="mb-4 text-[13px] font-black uppercase tracking-[0.08em] text-muse-text-muted">
              Payment method
            </p>
            <div className="flex items-center gap-3.5 rounded-[16px] bg-muse-cream-warm px-4 py-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muse-black text-muse-yellow">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </span>
              <div>
                <p
                  className="text-[15px] font-black text-muse-black"
                  data-testid="payment-method"
                >
                  MUSE Split Payment
                </p>
                <p className="mt-0.5 text-[12.5px] text-muse-text-muted">
                  {cardLabel
                    ? `Stored card — ${cardLabel}, charged weekly`
                    : "Stored card, charged weekly"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-muse-border bg-white p-6">
            <p className="mb-4 text-[13px] font-black uppercase tracking-[0.08em] text-muse-text-muted">
              What happens next
            </p>
            {[
              [
                "1",
                "First split payment is created",
                "Stripe starts the weekly payment schedule.",
              ],
              [
                "2",
                "We hold fulfilment until paid",
                "The order ships once the final Split Payment is complete.",
              ],
              [
                "3",
                "You can ask us anytime",
                "Reply to your emails or message MUSE if anything looks off.",
              ],
            ].map(([step, title, body]) => (
              <div
                key={step}
                className="flex gap-3.5 border-b border-muse-border py-3.5 first:pt-0 last:border-b-0 last:pb-0"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muse-black text-[12px] font-black text-muse-cream">
                  {step}
                </span>
                <span>
                  <span className="block text-[14px] font-bold text-muse-black">
                    {title}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-5 text-muse-text-muted">
                    {body}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-[24px] border border-muse-border bg-white p-6 large:sticky large:top-24">
          {order && (
            <>
              <p className="mb-4 text-[13px] font-black uppercase tracking-[0.08em] text-muse-text-muted">
                Order total
              </p>
              <div className="mb-5 space-y-2 text-[13.5px]">
                <div className="flex justify-between gap-4">
                  <span className="text-muse-text-muted">
                    Subtotal ({items.length} item{items.length === 1 ? "" : "s"})
                  </span>
                  <strong>{formatMoney(order.subtotal)}</strong>
                </div>
                {(order.discount_total ?? 0) > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muse-text-muted">Discount</span>
                    <strong>-{formatMoney(order.discount_total)}</strong>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-muse-text-muted">Shipping</span>
                  <strong>
                    {(order.shipping_total ?? 0) === 0
                      ? "Free"
                      : formatMoney(order.shipping_total)}
                  </strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muse-text-muted">GST included</span>
                  <strong>{formatMoney(order.tax_total)}</strong>
                </div>
              </div>
            </>
          )}

          <p className="mb-4 text-[13px] font-black uppercase tracking-[0.08em] text-muse-text-muted">
            Payment schedule
          </p>
          <div className="mb-5 space-y-2.5 rounded-[18px] bg-muse-cream-warm p-4">
            {installmentDates.map((date, index) => {
              const isFinal = index === SPLIT_PAY_INSTALLMENTS - 1
              const amountCents = isFinal ? finalCents : baseCents
              return (
                <div
                  key={index}
                  className="flex items-center justify-between gap-4 text-[13.5px]"
                >
                  <span className="text-muse-text-muted">
                    {index === 0 ? "Today" : dateFormatter.format(date)}
                    <span className="ml-1.5 text-[11px] text-muse-text-muted/70">
                      Payment {index + 1} of {SPLIT_PAY_INSTALLMENTS}
                    </span>
                  </span>
                  <strong>{formatSplitPayMoney(amountCents, currency)}</strong>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between border-t-2 border-muse-black pt-3.5 text-[15px] font-black text-muse-black">
            <span>Total</span>
            <span>{formatSplitPayMoney(totalCents, currency)}</span>
          </div>

          <div className="mt-6 rounded-[16px] bg-muse-cream-warm p-4">
            <p className="text-[12.5px] font-bold text-muse-black">Need help?</p>
            <p className="mt-1 text-[12px] leading-[1.55] text-muse-text-muted">
              Email{" "}
              <a
                href="mailto:support@musenz.com"
                className="font-bold text-muse-orange"
              >
                support@musenz.com
              </a>
              {displayId ? ` with order #${displayId}.` : "."}
            </p>
          </div>

          <LocalizedClientLink
            href="/store"
            className="mt-6 flex w-full items-center justify-center rounded-full bg-muse-black px-5 py-4 text-[12.5px] font-black uppercase tracking-[0.1em] text-muse-cream transition hover:bg-muse-orange"
          >
            Continue shopping
          </LocalizedClientLink>
        </aside>
      </section>
    </main>
  )
}
