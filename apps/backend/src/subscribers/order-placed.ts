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

// Matches Medusa's own documented React Email subscriber example
// (docs.medusajs.com/cloud/emails/react-email) verbatim — "items.quantity"/
// "items.unit_price" is the officially supported query.graph field path.
// (A prior attempt switched to Modules.ORDER.retrieveOrder() with
// "items.detail", reasoning from the module service's internal field names —
// that's the wrong layer; query.graph's remote-query resolution handles the
// quantity/unit_price flattening itself and this is the path Medusa's own
// docs use, including for this exact email use case.)
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
 * actually looks settled (items priced, totals exceed the shipping-only
 * floor) rather than guessing a fixed delay. If it never settles, log loudly
 * and skip sending — a missing confirmation email that gets manually
 * resent is far better than one with a wrong total reaching the customer.
 */
async function fetchOrderWithRetry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  orderId: string,
  maxAttempts = 12,
  delayMs = 1000
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ORDER_EMAIL_FIELDS as unknown as string[],
      filters: { id: orderId },
    })
    const order = orders[0]
    const hasItems = Array.isArray(order?.items) && order.items.length > 0
    const itemsHavePricing =
      hasItems && order.items.every((item: any) => item.unit_price != null && item.quantity != null && item.unit_price > 0)
    const totalsReady = order?.item_total != null && order?.total != null && order.total > (order.shipping_total ?? 0)

    if (order && hasItems && itemsHavePricing && totalsReady) {
      return order
    }
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
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
      throw new Error(`Order ${data.id} never reached fully-priced totals after retrying — skipping confirmation email rather than sending wrong numbers. Needs manual resend.`)
    }

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
    // Stamped by attach-split-pay-metadata-workflow right after the storefront
    // completes the cart for a split-pay checkout (see
    // apps/storefront/src/app/api/split-pay/complete/route.ts). These orders
    // never ship on placement, so none of the nzstock/standard/mixed shipment
    // logic below applies — branch out before any of it runs.
    if (order.metadata?.muse_split_pay === "true") {
      const musePayItems = (order.items || []).map((item) => ({
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

    const props: OrderConfirmationProps = {
      customerName: shippingAddress?.first_name || "there",
      customerEmail: recipient,
      displayId: String(order.display_id),
      createdAt: order.created_at,
      currencyCode: order.currency_code,
      subtotal: order.item_total ?? order.total,
      shippingTotal: order.shipping_total ?? 0,
      discountTotal: order.discount_total ?? 0,
      taxTotal: order.tax_total ?? 0,
      total: order.total,
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
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
