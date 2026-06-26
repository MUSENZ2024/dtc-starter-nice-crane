import { HttpTypes } from "@medusajs/types"
import { cookies as nextCookies } from "next/headers"

import { isStripeLike, paymentInfoMap } from "@lib/constants"
import {
  getDeliveryDateRange,
  getOrderDeliveryEstimate,
} from "@lib/util/delivery-estimate"
import { getCartFulfilmentSummary, getFulfilmentState } from "@lib/util/fulfilment-state"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import PaymentMethodSummaryClient from "./payment-method-summary-client"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

type OrderLine = HttpTypes.StoreOrderLineItem & {
  metadata?: Record<string, unknown> | null
  unit_price?: number | null
  total?: number | null
  variant_id?: string | null
}

// "Shipping protection" is a real product/variant added as a cart line item
// at checkout (see getShippingProtectionItem in
// apps/storefront/src/modules/checkout/components/step-delivery) so it
// shows up in order.items like any other purchase — it isn't one, so it
// needs pulling out before items are grouped into shipments and surfaced as
// its own line in the totals breakdown instead. Match by variant ID when
// the env var is configured, and by title as a robust fallback (titles
// don't depend on an env var being set in whichever environment renders
// this — e.g. the order confirmation email's backend deploy).
const shippingProtectionVariantId =
  process.env.NEXT_PUBLIC_SHIPPING_PROTECTION_VARIANT_ID

function isShippingProtectionLine(item: OrderLine) {
  const variantId = item.variant_id ?? item.variant?.id
  if (shippingProtectionVariantId && variantId === shippingProtectionVariantId) {
    return true
  }
  return (item.product_title ?? item.title ?? "").trim().toLowerCase() === "shipping protection"
}

type OrderPayment = NonNullable<
  NonNullable<HttpTypes.StoreOrder["payment_collections"]>[number]["payments"]
>[number]

const formatMoney = (amount: number | null | undefined, currencyCode: string) =>
  convertToLocale({
    amount: amount ?? 0,
    currency_code: currencyCode,
  })

const formatStatus = (status?: string | null) =>
  status ? status.replace(/_/g, " ") : "not fulfilled"

const formatCardBrand = (brand?: unknown) =>
  typeof brand === "string" && brand.length > 0
    ? brand
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Card"

function getPaymentDisplayTitle(
  payment: OrderPayment,
  fallbackTitle: string
) {
  const last4 = payment.data?.card_last4

  if (isStripeLike(payment.provider_id) && typeof last4 === "string" && last4) {
    return `${formatCardBrand(payment.data?.card_brand)} ending ${last4}`
  }

  return fallbackTitle
}

function groupItemsByFulfillment(items: OrderLine[]) {
  const nzstock: OrderLine[] = []
  const standard: OrderLine[] = []

  items.forEach((item) => {
    const state = getFulfilmentState(item)
    if (state.kind === "nz-stock") {
      nzstock.push(item)
    } else {
      standard.push(item)
    }
  })

  return { nzstock, standard }
}

function TotalsRow({
  label,
  value,
  green,
  muted,
}: {
  label: string
  value: string
  green?: boolean
  muted?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between text-[13.5px] ${
        muted ? "text-[#999]" : "text-[#555]"
      }`}
    >
      <span>{label}</span>
      <span className={green ? "font-semibold text-[#1F7A3A]" : "text-[#0A0A0A]"}>
        {value}
      </span>
    </div>
  )
}

function OrderItemRow({
  item,
  currencyCode,
}: {
  item: OrderLine
  currencyCode: string
}) {
  const fulfilment = getFulfilmentState(item)

  return (
    <div className="flex gap-4 border-t border-[#E8E6E0] py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-[#F4F2ED]">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.product_title ?? item.title ?? "Order item"}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#999]">
            MUSE
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-black text-[#0A0A0A]">
          {item.product_title ?? item.title}
        </p>
        {item.variant?.title && (
          <p className="mt-1 text-[12.5px] text-[#666]">{item.variant.title}</p>
        )}
        <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#999]">
          Qty {item.quantity}
        </p>
        <p
          className={`mt-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] ${
            fulfilment.labelColor === "green" ? "text-[#1F7A3A]" : "text-[#C1440E]"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              fulfilment.labelColor === "green" ? "bg-[#1F7A3A]" : "bg-[#C1440E]"
            }`}
          />
          {fulfilment.shortLabel}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[14px] font-black text-[#0A0A0A]">
          {formatMoney(item.total ?? item.unit_price, currencyCode)}
        </p>
        {item.quantity > 1 && (
          <p className="mt-1 text-[12px] text-[#777]">
            {formatMoney(item.unit_price, currencyCode)} each
          </p>
        )}
      </div>
    </div>
  )
}

function FulfillmentMiniProgress({ status }: { status?: string | null }) {
  const steps = ["Order placed", "Preparing", "Tracking next"]

  return (
    <div className="mt-5 grid grid-cols-3 gap-2">
      {steps.map((step, index) => (
        <div key={step}>
          <div
            className={`mb-2 h-1.5 rounded-full ${
              index === 0 ? "bg-[#1F7A3A]" : "bg-[#E8E6E0]"
            }`}
          />
          <p
            className={`text-[10.5px] font-bold uppercase tracking-[0.08em] ${
              index === 0 ? "text-[#1F7A3A]" : "text-[#999]"
            }`}
          >
            {step}
          </p>
        </div>
      ))}
      <p className="col-span-3 mt-1 text-[12px] text-[#777]">
        Fulfillment status: {formatStatus(status)}
      </p>
    </div>
  )
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()
  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  const allItems = ((order.items ?? []) as OrderLine[]).sort((a, b) =>
    (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
  )
  const shippingProtectionItem = allItems.find(isShippingProtectionLine)
  const protectionAmount = shippingProtectionItem
    ? shippingProtectionItem.total ??
      (shippingProtectionItem.unit_price ?? 0) * shippingProtectionItem.quantity
    : 0
  const items = allItems.filter((item) => !isShippingProtectionLine(item))
  const { nzstock, standard } = groupItemsByFulfillment(items)
  const fulfilmentSummary = getCartFulfilmentSummary(items)
  const hasMixed = nzstock.length > 0 && standard.length > 0
  const orderDate = new Date(order.created_at ?? Date.now())
  const address = order.shipping_address
  // Only show a separate billing address card when it's actually different —
  // most orders have "same as shipping" ticked, and re-showing identical
  // details twice is just noise.
  const ADDRESS_COMPARE_KEYS = ["first_name", "last_name", "address_1", "address_2", "city", "province", "postal_code", "country_code"] as const
  const billingAddress =
    order.billing_address &&
    !ADDRESS_COMPARE_KEYS.every(
      (key) => (order.shipping_address?.[key] || "") === (order.billing_address?.[key] || "")
    )
      ? order.billing_address
      : null
  const payment = order.payment_collections?.[0]?.payments?.[0]
  const paymentTitle = payment
    ? paymentInfoMap[payment.provider_id]?.title ?? payment.provider_id
    : "Payment confirmed"
  const paymentDisplayTitle = payment
    ? getPaymentDisplayTitle(payment, paymentTitle)
    : paymentTitle
  const paymentAmountText = `${formatMoney(order.total, order.currency_code)} ${order.currency_code?.toUpperCase()} charged`
  const discountCode =
    (order as HttpTypes.StoreOrder & { discounts?: { code?: string }[] })
      .discounts?.[0]?.code ?? "Discount"
  // Shipping options are configured in admin with names like "NZ Stock
  // Standard" / "International Express" that describe the fulfillment lane,
  // not what the customer actually picked at checkout — the only two
  // choices there are Standard or Express delivery (see getDeliveryLabel in
  // step-delivery), so that's what should show here, not the raw option name.
  const shippingMethodName = (order.shipping_methods?.[0] as { name?: string } | undefined)?.name
  const shippingMethod = shippingMethodName?.toLowerCase().includes("express") ? "Express Delivery" : "Standard Delivery"

  return (
    <div
      className="min-h-screen bg-[#F4F2ED] text-[#1A1A1A]"
      data-testid="order-complete-container"
    >
      <header className="sticky top-0 z-50 flex h-[60px] items-center justify-between bg-[#0A0A0A] px-[18px] small:h-16 small:px-8">
        <LocalizedClientLink href="/" className="flex items-center">
          <img
            src="https://d3k81ch9hvuctc.cloudfront.net/company/WsZzTe/images/18ad57dd-63d9-4151-9f41-dccf70026e4c.png"
            alt="MUSE"
            className="h-7 w-auto"
          />
        </LocalizedClientLink>
        <div className="flex items-center gap-5">
          <LocalizedClientLink
            href="/store"
            className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#AAA] transition hover:text-[#F4F2ED]"
          >
            Continue shopping
          </LocalizedClientLink>
          <span className="hidden items-center gap-1.5 text-[12px] text-[#666] small:flex">
            Order secured
          </span>
        </div>
      </header>

      <div className="bg-[#0A0A0A] px-[18px] py-10 text-center small:px-8 small:py-11">
        <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#1F7A3A]">
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
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#1F7A3A]">
          Payment confirmed
        </p>
        <h1 className="mb-3.5 text-[clamp(28px,5vw,42px)] font-black leading-[1.05] tracking-[-0.03em] text-[#F4F2ED]">
          Your order is in.
        </h1>
        <div className="mx-auto mb-3.5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-[18px] py-2 text-[15px] font-black text-[#F4F2ED]">
          Order{" "}
          <span className="text-[#C8D050]" data-testid="order-id">
            #{order.display_id}
          </span>
        </div>
        <p className="text-[13.5px] text-[#888]">
          We’ll email your confirmation to{" "}
          <strong className="text-[#BBB]" data-testid="order-email">
            {order.email}
          </strong>{" "}
          - check your junk if it does not arrive within 5 minutes.
        </p>
      </div>

      <div className="mx-auto grid max-w-[1160px] gap-10 px-[18px] py-10 small:px-8 large:grid-cols-[1fr_360px] large:py-12">
        <div>
          {isOnboarding && <OnboardingCta orderId={order.id} />}

          {nzstock.length > 0 && (
            <ShipmentCard
              title="NZ Stock"
              estimate={getOrderDeliveryEstimate("nzstock", orderDate)}
              items={nzstock}
              currencyCode={order.currency_code}
              status={order.fulfillment_status}
              shipmentLabel={hasMixed ? "Shipment 1 of 2" : undefined}
              green
            />
          )}

          {standard.length > 0 && (
            <ShipmentCard
              title="Standard Delivery"
              estimate={getOrderDeliveryEstimate("standard", orderDate)}
              items={standard}
              currencyCode={order.currency_code}
              status={order.fulfillment_status}
              shipmentLabel={hasMixed ? "Shipment 2 of 2" : undefined}
            />
          )}

          {items.length === 0 && (
            <div className="mb-4 rounded-[20px] border border-[#E8E6E0] bg-white p-6">
              <p className="text-[14px] text-[#666]">
                Your order items are being finalised.
              </p>
            </div>
          )}

          <div className="mb-4 rounded-[20px] border border-[#E8E6E0] bg-white p-6">
            <p className="mb-4 text-[13px] font-black uppercase tracking-[0.04em] text-[#666]">
              Delivery Details
            </p>
            <div className="grid gap-4 small:grid-cols-2">
              <div>
                <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#999]">
                  Delivering to
                </p>
                <div
                  className="text-[13.5px] leading-[1.7] text-[#1A1A1A]"
                  data-testid="shipping-address-summary"
                >
                  <strong className="font-bold">
                    {address?.first_name} {address?.last_name}
                  </strong>
                  <br />
                  {address?.address_1}
                  {address?.address_2 && <>, {address.address_2}</>}
                  <br />
                  {address?.city}
                  {address?.province && `, ${address.province}`}{" "}
                  {address?.postal_code}
                  <br />
                  {(address?.country_code ?? "nz").toUpperCase()}
                  {address?.phone && (
                    <span className="mt-2 block text-[#666]">Phone: {address.phone}</span>
                  )}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#999]">
                  Shipping method
                </p>
                <div
                  className="text-[13.5px] leading-[1.7] text-[#1A1A1A]"
                  data-testid="shipping-method-summary"
                >
                  {shippingMethod}
                  <br />
                  <span className="text-[#666]">
                    {fulfilmentSummary.hasMixed
                      ? fulfilmentSummary.fullOrderLabel
                      : standard.length > 0
                      ? "13-16 business days"
                      : "1-3 business days"}
                  </span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#C3E8CF] bg-[#EBF5EE] px-3 py-1 text-[12px] font-bold text-[#1F7A3A]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1F7A3A]" />
                  {getDeliveryDateRange(
                    standard.length > 0 || hasMixed ? 13 : 1,
                    standard.length > 0 || hasMixed ? 16 : 3,
                    orderDate
                  )}
                </div>
              </div>
            </div>
            {billingAddress && (
              <div className="mt-4 border-t border-[#E8E6E0] pt-4">
                <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#999]">
                  Billing address
                </p>
                <div className="text-[13.5px] leading-[1.7] text-[#1A1A1A]" data-testid="billing-address-summary">
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
                    <span className="mt-2 block text-[#666]">Phone: {billingAddress.phone}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {payment && (
            <div className="mb-4 rounded-[20px] border border-[#E8E6E0] bg-white p-6">
              <p className="mb-4 text-[13px] font-black uppercase tracking-[0.04em] text-[#666]">
                Payment
              </p>
              <div className="flex items-center gap-3.5 rounded-[14px] bg-[#F8F7F4] px-4 py-3.5">
                <PaymentMethodSummaryClient
                  initialTitle={paymentDisplayTitle}
                  amountText={paymentAmountText}
                />
                <span className="rounded-full border border-[#C3E8CF] bg-[#EBF5EE] px-2.5 py-1 text-[11px] font-bold text-[#1F7A3A]">
                  Paid
                </span>
              </div>
            </div>
          )}

          <div className="mb-8 rounded-[20px] border border-[#E8E6E0] bg-white p-6">
            <p className="mb-4 text-[13px] font-black uppercase tracking-[0.04em] text-[#666]">
              What Happens Next
            </p>
            {[
              [
                "1",
                "We're preparing your order",
                hasMixed
                  ? "Your order contains items from two sources, so they may ship separately."
                  : nzstock.length > 0
                  ? "Your items are held in our NZ workspace and will be dispatched shortly."
                  : "Our team will quality-check and pack your items before dispatch.",
              ],
              [
                "2",
                hasMixed
                  ? "You'll get a shipping email per parcel"
                  : "Shipping confirmation email",
                hasMixed
                  ? "Each shipment sends its own dispatch confirmation and tracking number."
                  : "Once dispatched, you'll get an email with tracking details.",
              ],
              [
                "3",
                "Track from My Orders",
                "All shipment updates are visible from your account orders area.",
              ],
            ].map(([num, title, description]) => (
              <div
                key={num}
                className="flex gap-3.5 border-b border-[#E8E6E0] py-3.5 first:pt-0 last:border-b-0 last:pb-0"
              >
                <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#0A0A0A] text-[12px] font-black text-[#F4F2ED]">
                  {num}
                </div>
                <div>
                  <p className="mb-0.5 text-[14px] font-bold text-[#0A0A0A]">
                    {title}
                  </p>
                  <p className="text-[13px] leading-[1.55] text-[#666]">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <LocalizedClientLink
            href="/store"
            className="flex w-full items-center justify-center rounded-full bg-[#0A0A0A] py-[18px] text-[14px] font-black uppercase tracking-[0.08em] text-[#F4F2ED] transition hover:bg-[#C1440E]"
          >
            Continue Shopping
          </LocalizedClientLink>
        </div>

        <aside className="h-fit rounded-[24px] border border-[#E8E6E0] bg-white p-6 large:sticky large:top-24">
          <p className="mb-4 text-[13px] font-black uppercase tracking-[0.04em] text-[#666]">
            Order Total
          </p>
          <div className="space-y-1.5">
            <TotalsRow
              label={`Subtotal (${items.length} item${items.length === 1 ? "" : "s"})`}
              value={formatMoney((order.subtotal ?? 0) - protectionAmount, order.currency_code)}
            />
            {(order.discount_total ?? 0) > 0 && (
              <TotalsRow
                label={`${discountCode} applied`}
                value={`-${formatMoney(order.discount_total, order.currency_code)}`}
                green
              />
            )}
            <TotalsRow
              label={shippingMethod}
              value={
                (order.shipping_total ?? 0) === 0
                  ? "Free"
                  : formatMoney(order.shipping_total, order.currency_code)
              }
              green={(order.shipping_total ?? 0) === 0}
            />
            {protectionAmount > 0 && (
              <TotalsRow
                label="Shipping protection"
                value={formatMoney(protectionAmount, order.currency_code)}
              />
            )}
            <TotalsRow
              label="GST included"
              value={formatMoney(order.tax_total, order.currency_code)}
              muted
            />
            <div className="mt-4 flex items-center justify-between border-t-2 border-[#0A0A0A] pt-3.5 text-[17px] font-black tracking-[-0.02em] text-[#0A0A0A]">
              <span>Total paid</span>
              <span data-testid="order-total">
                {formatMoney(order.total, order.currency_code)}
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-[16px] bg-[#F8F7F4] p-4">
            <p className="text-[12.5px] font-bold text-[#0A0A0A]">
              Need help?
            </p>
            <p className="mt-1 text-[12px] leading-[1.55] text-[#666]">
              Email{" "}
              <a href="mailto:support@musenz.com" className="font-bold text-[#C1440E]">
                support@musenz.com
              </a>{" "}
              with order #{order.display_id}.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ShipmentCard({
  title,
  estimate,
  items,
  currencyCode,
  status,
  shipmentLabel,
  green,
}: {
  title: string
  estimate: string
  items: OrderLine[]
  currencyCode: string
  status?: string | null
  shipmentLabel?: string
  green?: boolean
}) {
  return (
    <div className="mb-4 rounded-[20px] border border-[#E8E6E0] bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {shipmentLabel && (
            <span className="text-[13px] font-black uppercase tracking-[0.04em] text-[#666]">
              {shipmentLabel}
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.05em] ${
              green
                ? "border-[#C3E8CF] bg-[#EBF5EE] text-[#1F7A3A]"
                : "border-[#C7D9F8] bg-[#EEF4FF] text-[#2563EB]"
            }`}
          >
            {title}
          </span>
        </div>
        <span className="text-[12.5px] font-semibold text-[#666]">
          {estimate}
        </span>
      </div>
      {items.map((item) => (
        <OrderItemRow key={item.id} item={item} currencyCode={currencyCode} />
      ))}
      <FulfillmentMiniProgress status={status} />
    </div>
  )
}
