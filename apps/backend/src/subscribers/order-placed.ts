import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { render, pretty } from "@react-email/render"
import type { EmailItem, OrderConfirmationProps, Shipment } from "../emails/OrderConfirmationTemplate"
import getOrderPlacedMixedTemplate from "../emails/order-placed-mixed"
import getOrderPlacedNZStockTemplate from "../emails/order-placed-nzstock"
import getOrderPlacedStandardTemplate from "../emails/order-placed-standard"

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
  "customer.first_name",
  "customer.email",
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
 * Medusa's completeCartWorkflow emits "order.placed" from a parallelize() block
 * that runs at the same time as createRemoteLinkStep — the step that writes the
 * order/cart/payment module links query.graph relies on to resolve computed
 * fields like item_total/tax_total/total and items.quantity/unit_price.
 * addOrderTransactionStep (which finalizes the order) runs even later. So the
 * very first query.graph read after "order.placed" can race ahead of all of
 * that and come back with $0 totals / undefined item fields — which is exactly
 * what produced $NaN prices and a $0.00 subtotal in testing. Retrying a few
 * times with a short delay until totals/items are actually populated avoids
 * sending a broken confirmation email instead of just a slightly-delayed one.
 */
async function fetchOrderWithRetry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  orderId: string,
  maxAttempts = 6,
  delayMs = 500
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ORDER_EMAIL_FIELDS as unknown as string[],
      filters: { id: orderId },
    })
    const order = orders[0]
    const hasItems = Array.isArray(order?.items) && order.items.length > 0
    const itemsHavePricing = hasItems && order.items.every((item: any) => item.unit_price != null && item.quantity != null)
    const totalsReady = order?.item_total != null && order?.total != null && order.total > (order.shipping_total ?? 0)

    if (order && hasItems && itemsHavePricing && totalsReady) {
      return order
    }
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    } else if (order) {
      // Last attempt: send with whatever we have rather than dropping the
      // email entirely — better a late-but-complete email than a silent failure.
      return order
    }
  }
  return undefined
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
      customer?: { first_name?: string | null; email?: string | null } | null
      items?: OrderLine[] | null
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

    const recipient = order.customer?.email || order.email
    if (!recipient) {
      logger.warn(`Skipping order confirmation for ${order.id}: no customer email.`)
      return
    }

    const items: EmailItem[] = (order.items || []).map((item) => ({
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

    const address = order.shipping_address
    const addressLines = [
      [address?.first_name, address?.last_name].filter(Boolean).join(" "),
      address?.address_1,
      address?.address_2,
      [address?.city, address?.province, address?.postal_code].filter(Boolean).join(" "),
      address?.country_code?.toUpperCase() === "NZ" ? "New Zealand" : address?.country_code,
    ].filter(Boolean)

    const props: OrderConfirmationProps = {
      customerName: order.customer?.first_name || address?.first_name || "there",
      customerEmail: recipient,
      displayId: String(order.display_id),
      createdAt: order.created_at,
      currencyCode: order.currency_code,
      subtotal: order.item_total ?? order.total,
      shippingTotal: order.shipping_total ?? 0,
      discountTotal: order.discount_total ?? 0,
      taxTotal: order.tax_total ?? 0,
      total: order.total,
      address: addressLines.join("\n") || "Your delivery address",
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
    const notificationModule = container.resolve("notification")

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
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
