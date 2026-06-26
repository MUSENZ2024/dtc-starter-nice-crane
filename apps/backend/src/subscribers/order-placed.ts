import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { render, pretty } from "@react-email/render"
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
  quantity: number
  unit_price: number
  thumbnail?: string | null
  metadata?: Record<string, unknown> | null
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
    const totalsReady =
      order?.item_total != null && order?.total != null && toNumber(order.total) > toNumber(order.shipping_total)

    if (order && hasItems && itemsHavePricing && totalsReady) {
      return order
    }
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  return lastOrder
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

    const safeItems = withSafePricing(order.items || [], toNumber(order.item_total ?? order.total))

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

    const props: OrderConfirmationProps = {
      customerName: shippingAddress?.first_name || "there",
      customerEmail: recipient,
      displayId: String(order.display_id),
      createdAt: order.created_at,
      currencyCode: order.currency_code,
      subtotal: toNumber(order.item_total ?? order.total),
      shippingTotal: toNumber(order.shipping_total),
      discountTotal: toNumber(order.discount_total),
      taxTotal: toNumber(order.tax_total),
      total: toNumber(order.total),
      address: addressText,
      shipments,
      trackingUrl: `https://store.musenz.com/nz/track`,
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
