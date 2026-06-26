import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { render, pretty } from "@react-email/render"
import Stripe from "stripe"
import type { EmailItem, OrderConfirmationProps, Shipment } from "../emails/OrderConfirmationTemplate"
import getOrderPlacedMixedTemplate from "../emails/order-placed-mixed"
import getOrderPlacedNZStockTemplate from "../emails/order-placed-nzstock"
import getOrderPlacedStandardTemplate from "../emails/order-placed-standard"
import getOrderPlacedMusePayTemplate from "../emails/order-placed-musepay"
import type { MusePayConfirmationProps } from "../emails/order-placed-musepay"

type FulfillmentType = "nzstock" | "standard"

type OrderLine = {
  id: string
  product_title: string
  variant_title?: string | null
  variant_id?: string | null
  quantity: number
  unit_price: number
  thumbnail?: string | null
  metadata?: Record<string, unknown> | null
}

// Matches the variant the storefront's checkout adds as a real cart line
// item when "Shipping protection" is checked (see getShippingProtectionItem
// in apps/storefront/src/modules/checkout/components/step-delivery) — it's
// a genuine product line, not order metadata, so it has to be filtered out
// of the item list and surfaced as its own line in the totals breakdown.
// The variant-ID env var is the storefront's NEXT_PUBLIC_ var, which this
// backend deploy never has set — title match is the fallback that actually
// works without coordinating an extra env var across both apps.
const SHIPPING_PROTECTION_VARIANT_ID =
  process.env.SHIPPING_PROTECTION_VARIANT_ID || process.env.NEXT_PUBLIC_SHIPPING_PROTECTION_VARIANT_ID

function isShippingProtectionLine(item: OrderLine): boolean {
  if (SHIPPING_PROTECTION_VARIANT_ID && item.variant_id === SHIPPING_PROTECTION_VARIANT_ID) {
    return true
  }
  return item.product_title?.trim().toLowerCase() === "shipping protection"
}

function splitShippingProtection(items: OrderLine[]): { items: OrderLine[]; protectionAmount: number } {
  const protectionItem = items.find(isShippingProtectionLine)
  if (!protectionItem) {
    return { items, protectionAmount: 0 }
  }
  return {
    items: items.filter((item) => item.id !== protectionItem.id),
    protectionAmount: toNumber(protectionItem.unit_price) * (toNumber(protectionItem.quantity) || 1),
  }
}

// The only two delivery methods customers can choose at checkout (see
// getDeliveryLabel in apps/storefront/src/modules/checkout/components/step-delivery)
// — the email must use this same wording, not the nzstock/standard
// fulfillment-lane distinction, which is a separate concept (where the stock
// physically ships from, not how fast the customer paid to have it shipped).
function getShippingMethodLabel(shippingMethodName?: string | null): string {
  return shippingMethodName?.toLowerCase().includes("express") ? "Express Delivery" : "Standard Delivery"
}

const STRIPE_PAYMENT_METHOD_LABELS: Record<string, string> = {
  afterpay_clearpay: "Afterpay",
  klarna: "Klarna",
  affirm: "Affirm",
  link: "Link",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
}

/**
 * Customers don't care that we use Stripe under the hood — "Paid securely by
 * Stripe" reads like internal infra info, not something useful to them. They
 * care what they paid WITH: card brand + last 4, or Afterpay, or (for split
 * orders, handled by the separate MUSE Pay template) MUSE Pay. Stripe's
 * PaymentIntent/PaymentMethod data only includes the brand if the payment
 * method object is expanded — Medusa's stripe provider doesn't do that by
 * default — so this makes one extra Stripe API call, best-effort, and falls
 * back to a generic "Card" if anything about that call fails.
 */
async function derivePaymentMethodLabel(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any
): Promise<string> {
  const payment = order?.payment_collections?.[0]?.payments?.[0]
  if (!payment) {
    return "Card"
  }

  const providerId: string | undefined = payment.provider_id
  const data = payment.data as Record<string, unknown> | undefined
  if (!providerId?.includes("stripe") || !data) {
    return "Card"
  }

  const methodType = Array.isArray(data.payment_method_types) ? (data.payment_method_types[0] as string) : undefined
  if (methodType && STRIPE_PAYMENT_METHOD_LABELS[methodType]) {
    return STRIPE_PAYMENT_METHOD_LABELS[methodType]
  }

  const paymentMethodId = typeof data.payment_method === "string" ? data.payment_method : undefined
  if (!paymentMethodId || !process.env.STRIPE_API_KEY) {
    return "Card"
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_API_KEY)
    const method = await stripe.paymentMethods.retrieve(paymentMethodId)
    if (method.card) {
      const brand = method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1)
      return `${brand} •••• ${method.card.last4}`
    }
    return "Card"
  } catch {
    return "Card"
  }
}

const getFulfillmentType = (metadata?: Record<string, unknown> | null): FulfillmentType =>
  metadata?.fulfillment_type === "nzstock" ? "nzstock" : "standard"

/**
 * The actual root cause of every "$NaN"/broken-price email in this
 * subscriber's history: Medusa v2 represents money and quantity fields
 * internally as BigNumber-like objects — `{ numeric_, raw_, bignumber_ }` —
 * not plain JS numbers. query.graph sometimes hands these back as-is rather
 * than the plain number the field "looks" like it should be. Multiplying
 * two such objects (`unitPrice * quantity`) silently coerces to NaN, and
 * passing one directly into a React Email template throws
 * "Objects are not valid as a React child" (confirmed via Cloud runtime
 * logs — this is what was actually killing every order.placed email since
 * order #24, not a query timing race). Coercing every numeric field to a
 * plain number immediately after the query — before any arithmetic or
 * template construction — eliminates this at the source.
 */
function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value
  }
  if (value && typeof value === "object" && "numeric_" in (value as Record<string, unknown>)) {
    return Number((value as { numeric_: unknown }).numeric_) || 0
  }
  const coerced = Number(value)
  return Number.isFinite(coerced) ? coerced : 0
}

function withSafePricing(items: OrderLine[], itemTotal: number): OrderLine[] {
  const fallbackUnitPrice = items.length > 0 ? itemTotal / items.length : 0
  return items.map((item) => {
    const quantity = toNumber(item.quantity) || 1
    const unitPrice = item.unit_price == null ? fallbackUnitPrice : toNumber(item.unit_price)
    return { ...item, quantity, unit_price: unitPrice }
  })
}

// Verbatim from Medusa's own "order.placed" subscriber example
// (docs.medusajs.com/cloud/emails/react-email#order-placed-email-template).
// A prior attempt switched to the "items.*" wildcard on the theory that
// explicit field paths weren't resolving — that wasn't the real problem
// (see toNumber() above for what actually was), and the wildcard pulled in
// extra BigNumber-shaped fields with no clearer benefit. Back to the
// documented field list.
const ORDER_EMAIL_FIELDS = [
  "id",
  "email",
  "display_id",
  "created_at",
  "currency_code",
  "item_total",
  "shipping_total",
  "discount_total",
  "tax_total",
  "total",
  "metadata",
  "items.id",
  "items.product_title",
  "items.variant_title",
  "items.variant_id",
  "items.quantity",
  "items.unit_price",
  "items.thumbnail",
  "items.metadata",
  "shipping_address.first_name",
  "shipping_address.last_name",
  "shipping_address.address_1",
  "shipping_address.address_2",
  "shipping_address.city",
  "shipping_address.province",
  "shipping_address.postal_code",
  "shipping_address.country_code",
  "shipping_methods.name",
  "payment_collections.payments.provider_id",
  "payment_collections.payments.data",
] as const

/**
 * Medusa's completeCartWorkflow emits "order.placed" from a parallelize()
 * step that runs alongside createRemoteLinkStep — the step that writes the
 * module links query.graph depends on to resolve totals/items correctly.
 * The very first read after that event can race ahead of those writes and
 * come back with $0 totals / undefined item pricing. Retry until the data
 * looks settled rather than guessing a fixed delay.
 *
 * Always returns the order once it's found — even if pricing never fully
 * settles within the retry budget. A previous version skipped sending
 * entirely in that case, on the theory that no email is better than a wrong
 * one. In practice that meant some orders got zero email at all, which is
 * worse: a customer who never hears from us is more alarmed than one who
 * gets a slightly-off line-item price. The order-level total (always
 * reliable, checked separately below) is what actually matters financially;
 * per-item display degrades gracefully in the template if needed.
 */
async function fetchOrderWithRetry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  orderId: string,
  maxAttempts = 10,
  delayMs = 1000
) {
  let lastOrder: any
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ORDER_EMAIL_FIELDS as unknown as string[],
      filters: { id: orderId },
    })
    const order = orders[0]
    lastOrder = order

    const hasItems = Array.isArray(order?.items) && order.items.length > 0
    const itemsHavePricing =
      hasItems && order.items.every((item: any) => item.unit_price != null && item.quantity != null)

    if (order && hasItems && itemsHavePricing) {
      return order
    }
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  return lastOrder
}

/**
 * The order-level totals (item_total/total/etc) handed back by query.graph
 * raced against the same module-link writes as item pricing did, except no
 * amount of retrying query.graph ever fixed it — the "$7.00 total" bug
 * persisted even once item pricing was correct. The order module service's
 * own retrieveOrder() computes totals synchronously from the order's own
 * item/tax_line/adjustment rows (see formatOrder() in
 * @medusajs/order's order-module-service) — it doesn't depend on the
 * cross-module link query.graph reads through, so it's reliable the moment
 * the order row itself exists, no retry needed.
 */
async function fetchOrderTotals(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  container: any,
  orderId: string
) {
  const orderModuleService = container.resolve(Modules.ORDER)
  return orderModuleService.retrieveOrder(orderId, {
    select: ["id", "item_total", "shipping_total", "discount_total", "tax_total", "total"],
  })
}

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")

  try {
    const { data: stores } = await query.graph({
      entity: "store",
      fields: ["name"],
    })
    const store = stores[0] as { name?: string } | undefined

    const order = (await fetchOrderWithRetry(query, data.id)) as {
      id: string
      email?: string | null
      display_id: number | string
      created_at: string
      currency_code: string
      item_total?: number
      shipping_total?: number
      discount_total?: number
      tax_total?: number
      total: number
      items?: OrderLine[] | null
      metadata?: Record<string, unknown> | null
      shipping_methods?: { name?: string | null }[] | null
      payment_collections?: { payments?: { provider_id?: string | null; data?: Record<string, unknown> }[] }[] | null
      shipping_address?: {
        first_name?: string | null
        last_name?: string | null
        address_1?: string | null
        address_2?: string | null
        city?: string | null
        province?: string | null
        postal_code?: string | null
        country_code?: string | null
      } | null
    } | undefined

    if (!order) {
      throw new Error(`Order ${data.id} was not found.`)
    }

    try {
      const authoritativeTotals = await fetchOrderTotals(container, order.id)
      order.item_total = authoritativeTotals.item_total
      order.shipping_total = authoritativeTotals.shipping_total
      order.discount_total = authoritativeTotals.discount_total
      order.tax_total = authoritativeTotals.tax_total
      order.total = authoritativeTotals.total
    } catch (totalsError) {
      logger.warn(
        `Could not fetch authoritative totals for order ${order.id}, falling back to query.graph values: ${
          totalsError instanceof Error ? totalsError.message : String(totalsError)
        }`
      )
    }

    const { items: itemsWithoutProtection, protectionAmount } = splitShippingProtection(order.items || [])
    const safeItems = withSafePricing(itemsWithoutProtection, toNumber(order.item_total ?? order.total))

    const recipient = order.email
    if (!recipient) {
      logger.warn(`Skipping order confirmation for ${order.id}: no customer email.`)
      return
    }

    const shippingAddress = order.shipping_address
    const addressLines = [
      [shippingAddress?.first_name, shippingAddress?.last_name].filter(Boolean).join(" "),
      shippingAddress?.address_1,
      shippingAddress?.address_2,
      [shippingAddress?.city, shippingAddress?.province, shippingAddress?.postal_code].filter(Boolean).join(" "),
      shippingAddress?.country_code?.toUpperCase() === "NZ" ? "New Zealand" : shippingAddress?.country_code,
    ].filter(Boolean)
    const addressText = addressLines.join("\n") || "Your delivery address"

    const notificationModule = container.resolve("notification")

    // ---- MUSE Pay split-payment orders get an entirely different email ----
    // Stamped on the cart's metadata before checkout completion (see
    // apps/storefront/src/app/api/split-pay/complete/route.ts) — Medusa's
    // completeCartWorkflow copies cart.metadata onto the new order at
    // creation time, so this is already present the moment order.placed
    // fires, no race against a separate post-completion call. These orders
    // never ship on placement, so none of the nzstock/standard/mixed shipment
    // logic below applies — branch out before any of it runs.
    if (order.metadata?.muse_split_pay === "true") {
      const musePayItems = (safeItems).map((item) => ({
        id: item.id,
        title: item.product_title,
        variantTitle: item.variant_title,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        thumbnail: item.thumbnail,
      }))

      const totalCents = Number(order.metadata.split_pay_total_cents ?? 0)
      const baseCents = Number(order.metadata.split_pay_base_cents ?? 0)
      const finalCents = Number(order.metadata.split_pay_final_cents ?? 0)

      const musePayProps: MusePayConfirmationProps = {
        customerName: shippingAddress?.first_name || "there",
        customerEmail: recipient,
        displayId: String(order.display_id),
        createdAt: order.created_at,
        currencyCode: order.currency_code,
        items: musePayItems,
        address: addressText,
        trackingUrl: `https://store.musenz.com/nz/track`,
        totalCents,
        baseCents,
        finalCents,
      }

      const musePayHtml = await pretty(await render(getOrderPlacedMusePayTemplate(musePayProps)))

      await notificationModule.createNotifications({
        to: recipient,
        from: process.env.MUSE_EMAIL_FROM || "orders@musenz.com",
        channel: "email",
        content: {
          html: musePayHtml,
          subject: `MUSE Pay Order Confirmation — ${store?.name || "MUSE NZ"} #${order.display_id}`,
        },
      })
      return
    }

    const items: EmailItem[] = (safeItems).map((item) => ({
      id: item.id,
      title: item.product_title,
      variantTitle: item.variant_title,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      thumbnail: item.thumbnail,
      fulfillmentType: getFulfillmentType(item.metadata),
    }))

    const nzStockItems = items.filter((item) => item.fulfillmentType === "nzstock")
    const standardItems = items.filter((item) => item.fulfillmentType === "standard")
    const shipments: Shipment[] = []

    if (nzStockItems.length) {
      shipments.push({
        type: "nzstock",
        label: standardItems.length ? "Shipment 1 of 2" : undefined,
        items: nzStockItems,
      })
    }
    if (standardItems.length) {
      shipments.push({
        type: "standard",
        label: nzStockItems.length ? "Shipment 2 of 2" : undefined,
        items: standardItems,
      })
    }

    // An empty order or missing line metadata must never promise a local ETA.
    if (!shipments.length) {
      shipments.push({ type: "standard", items: [] })
    }

    const paymentMethodLabel = await derivePaymentMethodLabel(order)

    const props: OrderConfirmationProps = {
      customerName: shippingAddress?.first_name || "there",
      customerEmail: recipient,
      displayId: String(order.display_id),
      createdAt: order.created_at,
      currencyCode: order.currency_code,
      subtotal: toNumber(order.item_total ?? order.total) - protectionAmount,
      shippingTotal: toNumber(order.shipping_total),
      shippingProtectionAmount: protectionAmount,
      discountTotal: toNumber(order.discount_total),
      taxTotal: toNumber(order.tax_total),
      total: toNumber(order.total),
      address: addressText,
      shipments,
      trackingUrl: `https://store.musenz.com/nz/track`,
      shippingMethodLabel: getShippingMethodLabel(order.shipping_methods?.[0]?.name),
      paymentMethodLabel,
    }

    const template =
      shipments.length > 1
        ? getOrderPlacedMixedTemplate(props)
        : shipments[0].type === "nzstock"
          ? getOrderPlacedNZStockTemplate(props)
          : getOrderPlacedStandardTemplate(props)
    const html = await pretty(await render(template))

    await notificationModule.createNotifications({
      to: recipient,
      from: process.env.MUSE_EMAIL_FROM || "orders@musenz.com",
      channel: "email",
      content: {
        html,
        subject: `Order Confirmation — ${store?.name || "MUSE NZ"} #${order.display_id}`,
      },
    })
  } catch (error) {
    logger.error(
      `Order confirmation failed for ${data.id}: ${
        error instanceof Error ? error.stack ?? error.message : String(error)
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
