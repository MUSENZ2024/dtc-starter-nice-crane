import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { render, pretty } from "@react-email/render"
import type { EmailItem } from "../emails/OrderConfirmationTemplate"
import getOrderShippedTemplate from "../emails/order-shipped"
import { resolveLineItemImage } from "../lib/resolve-line-item-image"

type FulfillmentType = "nzstock" | "standard"

type FulfillmentEventData = {
  id?: string
  fulfillment_id?: string
}

type OrderLine = {
  id: string
  product_title: string
  variant_title?: string | null
  quantity: number
  unit_price: number
  thumbnail?: string | null
  metadata?: Record<string, unknown> | null
  variant?: {
    images?: { id?: string | null }[] | null
    product?: {
      thumbnail?: string | null
      images?: { id?: string | null; url?: string | null; rank?: number | null }[] | null
    } | null
  } | null
}

type AddressFields = {
  first_name?: string | null
  last_name?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
  phone?: string | null
}

type FulfillmentLabel = {
  tracking_number?: string | null
  tracking_url?: string | null
  label_url?: string | null
}

type FulfillmentOrder = {
  id: string
  email?: string | null
  display_id: number | string
  currency_code: string
  items?: OrderLine[] | null
  shipping_methods?: { name?: string | null }[] | null
  shipping_address?: AddressFields | null
}

function formatAddressLines(address?: AddressFields | null): { lines: string[]; phone: string | null } {
  const lines = [
    [address?.first_name, address?.last_name].filter(Boolean).join(" "),
    address?.address_1,
    address?.address_2,
    [address?.city, address?.province, address?.postal_code].filter(Boolean).join(" "),
    address?.country_code?.toUpperCase() === "NZ" ? "New Zealand" : address?.country_code,
  ].filter((line): line is string => Boolean(line))

  return { lines: lines.length ? lines : ["Your delivery address"], phone: address?.phone || null }
}

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

const getFulfillmentType = (metadata?: Record<string, unknown> | null): FulfillmentType =>
  metadata?.fulfillment_type === "nzstock" ? "nzstock" : "standard"

function getShippingMethodLabel(shippingMethodName?: string | null): string {
  return shippingMethodName?.toLowerCase().includes("express") ? "Express Delivery" : "Standard Delivery"
}

function getTrackingUrl(trackingNumber: string, trackingUrl?: string | null): string {
  if (trackingUrl) {
    return trackingUrl
  }
  return `https://store.musenz.com/nz/track?number=${encodeURIComponent(trackingNumber)}`
}

const FULFILLMENT_EMAIL_FIELDS = [
  "id",
  "labels.tracking_number",
  "labels.tracking_url",
  "labels.label_url",
  "order.id",
  "order.email",
  "order.display_id",
  "order.currency_code",
  "order.items.id",
  "order.items.product_title",
  "order.items.variant_title",
  "order.items.quantity",
  "order.items.unit_price",
  "order.items.thumbnail",
  "order.items.metadata",
  "order.items.variant.images.id",
  "order.items.variant.product.thumbnail",
  "order.items.variant.product.images.id",
  "order.items.variant.product.images.url",
  "order.items.variant.product.images.rank",
  "order.shipping_methods.name",
  "order.shipping_address.first_name",
  "order.shipping_address.last_name",
  "order.shipping_address.address_1",
  "order.shipping_address.address_2",
  "order.shipping_address.city",
  "order.shipping_address.province",
  "order.shipping_address.postal_code",
  "order.shipping_address.country_code",
  "order.shipping_address.phone",
] as const

export default async function orderShippedHandler({
  event: { data },
  container,
}: SubscriberArgs<FulfillmentEventData>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")

  try {
    const fulfillmentId = data.id || data.fulfillment_id
    if (!fulfillmentId) {
      logger.warn("Skipping shipped email: fulfillment event had no fulfillment id.")
      return
    }

    const { data: fulfillments } = await query.graph({
      entity: "fulfillment",
      fields: FULFILLMENT_EMAIL_FIELDS as unknown as string[],
      filters: { id: fulfillmentId },
    })

    const fulfillment = fulfillments[0] as
      | {
          id: string
          labels?: FulfillmentLabel[] | null
          order?: FulfillmentOrder | null
        }
      | undefined

    const label = fulfillment?.labels?.find((entry) => entry.tracking_number)
    const trackingNumber = label?.tracking_number?.trim()

    if (!fulfillment || !trackingNumber) {
      logger.info(`Skipping shipped email for fulfillment ${fulfillmentId}: no tracking number label yet.`)
      return
    }

    const order = fulfillment.order
    if (!order?.email) {
      logger.warn(`Skipping shipped email for fulfillment ${fulfillmentId}: no order email.`)
      return
    }

    const shippingAddress = order.shipping_address
    const addressDetail = formatAddressLines(shippingAddress)
    const shippingMethodLabel = getShippingMethodLabel(order.shipping_methods?.[0]?.name)

    const items: EmailItem[] = (order.items || []).map((item) => ({
      id: item.id,
      title: item.product_title,
      variantTitle: item.variant_title,
      quantity: toNumber(item.quantity) || 1,
      unitPrice: toNumber(item.unit_price),
      thumbnail: resolveLineItemImage(item),
      fulfillmentType: getFulfillmentType(item.metadata),
    }))

    const fulfillmentType = items.some((item) => item.fulfillmentType === "nzstock") ? "nzstock" : "standard"
    const trackingUrl = getTrackingUrl(trackingNumber, label?.tracking_url)
    const notificationModule = container.resolve("notification")

    const html = await pretty(
      await render(
        getOrderShippedTemplate({
          customerName: shippingAddress?.first_name || "there",
          customerEmail: order.email,
          displayId: String(order.display_id),
          currencyCode: order.currency_code,
          shippingMethodLabel,
          carrierName: "International courier",
          trackingNumber,
          trackingUrl,
          shippedAt: new Date().toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" }),
          estimatedDeliveryLabel: "",
          addressLines: addressDetail.lines,
          phone: addressDetail.phone,
          items,
          fulfillmentType,
          currentStage: fulfillmentType === "nzstock" ? "shipped" : "international_transit",
        })
      )
    )

    await notificationModule.createNotifications({
      to: order.email,
      from: process.env.MUSE_EMAIL_FROM || "orders@musenz.com",
      channel: "email",
      content: {
        html,
        subject: "MUSE NZ: Your order has been shipped ✈️",
      },
    })
  } catch (error) {
    logger.error(
      `Shipped email failed: ${
        error instanceof Error ? error.stack ?? error.message : String(error)
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: "shipment.created",
}
