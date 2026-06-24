import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
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

// Fields that trigger OrderModuleService.retrieveOrder() to compute totals
// in-process from the order's own items/tax_lines/adjustments — see note below.
const ORDER_TOTAL_FIELDS = [
  "total",
  "item_total",
  "shipping_total",
  "discount_total",
  "tax_total",
]

const ORDER_SELECT_FIELDS = [
  "id",
  "email",
  "display_id",
  "created_at",
  "currency_code",
  "metadata",
  ...ORDER_TOTAL_FIELDS,
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
]

/**
 * Why this resolves the Order module directly instead of using query.graph:
 *
 * Medusa's completeCartWorkflow emits "order.placed" from a parallelize() block
 * that runs at the same time as createRemoteLinkStep — the step that writes the
 * order/cart/payment *module links* query.graph depends on to resolve
 * cross-module fields. Reading through query.graph right after that event can
 * race ahead of those link writes and return incomplete data.
 *
 * Order totals and line items aren't cross-module data, though — they're
 * native to the Order module itself, computed synchronously inside
 * OrderModuleService.retrieveOrder() from the order's own items/tax_lines/
 * adjustments the moment any of the total fields (item_total, total, etc.)
 * are requested in `select`. Resolving Modules.ORDER and calling
 * retrieveOrder() directly reads that module's own tables and sidesteps the
 * remote-link race entirely — no retry loop needed. This is also why
 * order.email / order.shipping_address are used for recipient + name below
 * instead of order.customer — the customer link IS a cross-module relation,
 * and the email/shipping address fields cover everything this email needs
 * without it.
 */
async function fetchOrder(container: any, orderId: string) {
  const orderModuleService = container.resolve(Modules.ORDER)
  return orderModuleService.retrieveOrder(orderId, {
    select: ORDER_SELECT_FIELDS,
    relations: ["items", "shipping_address"],
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

    const order = (await fetchOrder(container, data.id)) as {
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
