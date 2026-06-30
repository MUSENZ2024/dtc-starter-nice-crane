import { Modules } from "@medusajs/framework/utils"
import { render, pretty } from "@react-email/render"
import type { EmailItem } from "../emails/OrderConfirmationTemplate"
import type { OrderArrivedNzProps } from "../emails/OrderArrivedNzTemplate"
import getOrderArrivedNzTemplate from "../emails/order-arrived-nz"
import {
  formatAddressLines,
  getFulfillmentType,
  getShippingMethodLabel,
  splitShippingProtection,
  toNumber,
  withSafePricing,
} from "./order-preparing-email"

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

export type ArrivedNzEmailOrder = {
  id: string
  email?: string | null
  display_id: number | string
  created_at?: string
  currency_code: string
  item_total?: number
  shipping_total?: number
  discount_total?: number
  tax_total?: number
  total: number
  metadata?: Record<string, unknown> | null
  items?: OrderLine[] | null
  shipping_methods?: { name?: string | null }[] | null
  shipping_address?: AddressFields | null
}

export type ArrivedNzFulfillmentLabel = {
  tracking_number?: string | null
  tracking_url?: string | null
  label_url?: string | null
  metadata?: Record<string, unknown> | null
  status?: string | null
}

export type ArrivedNzFulfillment = {
  id: string
  created_at?: string
  metadata?: Record<string, unknown> | null
  labels?: ArrivedNzFulfillmentLabel[] | null
  order?: ArrivedNzEmailOrder | null
}

type TrackingEvent = {
  description?: string
  location?: string
  time_iso?: string
  time_utc?: string
}

type TrackingProvider = {
  provider?: {
    name?: string
  }
  events?: TrackingEvent[]
}

export type TrackInfo = {
  latest_status?: {
    status?: string
  }
  tracking?: {
    providers?: TrackingProvider[]
  }
}

export const ORDER_ARRIVED_NZ_SENT_METADATA_KEY = "muse_order_arrived_nz_email_sent_at"
export const ORDER_ARRIVED_NZ_TEMPLATE_KEY = "order_arrived_nz"
export const ORDER_ARRIVED_NZ_SUBJECT = "MUSE NZ: Your order has arrived in NZ 🇳🇿"
export const MUSE_TRACKING_WORKER_URL =
  process.env.MUSE_TRACKING_WORKER_URL || "https://muse-track.nz-nofilter.workers.dev"

export const ORDER_ARRIVED_NZ_FULFILLMENT_FIELDS = [
  "id",
  "created_at",
  "metadata",
  "labels.tracking_number",
  "labels.tracking_url",
  "labels.label_url",
  "order.id",
  "order.email",
  "order.display_id",
  "order.created_at",
  "order.currency_code",
  "order.item_total",
  "order.shipping_total",
  "order.discount_total",
  "order.tax_total",
  "order.total",
  "order.metadata",
  "order.items.id",
  "order.items.product_title",
  "order.items.variant_title",
  "order.items.variant_id",
  "order.items.quantity",
  "order.items.unit_price",
  "order.items.thumbnail",
  "order.items.metadata",
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

export function getTrackingUrl(trackingNumber: string, trackingUrl?: string | null): string {
  if (trackingUrl) {
    return trackingUrl
  }

  return `https://store.musenz.com/nz/track?number=${encodeURIComponent(trackingNumber)}`
}

function metadataValueIncludes(metadata: Record<string, unknown> | null | undefined, needles: string[]): boolean {
  if (!metadata) {
    return false
  }

  return Object.values(metadata).some((value) => {
    if (value == null) {
      return false
    }

    const normalized = String(value).toLowerCase()
    return needles.some((needle) => normalized.includes(needle))
  })
}

function metadataFlag(metadata: Record<string, unknown> | null | undefined, keys: string[]): boolean {
  if (!metadata) {
    return false
  }

  return keys.some((key) => {
    const value = metadata[key]
    return value === true || value === "true" || value === "yes" || value === "arrived"
  })
}

const includesAny = (text: string, phrases: string[]) =>
  phrases.some((phrase) => text.includes(phrase))

const DELIVERED_EVENTS = ["delivered", "successfully signed", "successfully received"]

const OUT_FOR_DELIVERY_EVENTS = [
  "out for delivery",
  "with courier",
  "on vehicle",
  "delivery today",
  "ready for courier",
]

const NZ_LOCAL_EVENTS = [
  "local/regional depot",
  "local depot",
  "regional depot",
  "in transit to local depot",
  "leaving the new zealand processing center",
  "leaving new zealand processing center",
]

const NZ_ARRIVAL_EVENTS = [
  "international arrival",
  "arrived in new zealand",
  "arrived in nz",
  "pending border clearance",
  "arrived at destination",
  "arrival at destination",
  "destination processing center",
  "destination processing centre",
  "plane arriving",
  "with nz post",
]

function normaliseCarrier(name?: string) {
  const normalised = (name || "").toLowerCase()

  if (normalised.includes("nz post") || normalised.includes("new zealand post")) {
    return "nz post"
  }

  return normalised
}

function flattenTrackingEvents(track: TrackInfo | undefined) {
  const events: Array<{ desc: string; carrier: string; rawTime?: string }> = []

  ;(track?.tracking?.providers || []).forEach((provider) => {
    const carrier = normaliseCarrier(provider.provider?.name)

    ;(provider.events || []).forEach((event) => {
      events.push({
        desc: `${event.description || ""} ${event.location || ""}`.toLowerCase(),
        carrier,
        rawTime: event.time_iso || event.time_utc,
      })
    })
  })

  return events.sort(
    (a, b) =>
      new Date(b.rawTime || "").getTime() -
      new Date(a.rawTime || "").getTime()
  )
}

export function trackingInfoHasArrivedInNz(track: TrackInfo | undefined): boolean {
  const rawStatus = (track?.latest_status?.status || "")
    .replace(/_/g, " ")
    .toLowerCase()
  const events = flattenTrackingEvents(track)
  const latestEvent = events[0]
  const latestDesc = latestEvent?.desc || ""
  const combined = `${rawStatus} ${latestDesc}`

  if (includesAny(combined, DELIVERED_EVENTS)) {
    return false
  }

  if (includesAny(combined, OUT_FOR_DELIVERY_EVENTS)) {
    return true
  }

  return (
    latestEvent?.carrier === "nz post" ||
    includesAny(latestDesc, [...NZ_LOCAL_EVENTS, ...NZ_ARRIVAL_EVENTS]) ||
    includesAny(combined, NZ_ARRIVAL_EVENTS)
  )
}

export async function fetchTrackingInfo(trackingNumber: string): Promise<TrackInfo | null> {
  const response = await fetch(MUSE_TRACKING_WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: "gettrackinfo",
      body: [{ number: trackingNumber }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Tracking worker returned ${response.status}`)
  }

  const payload = await response.json() as {
    data?: {
      accepted?: Array<{
        track_info?: TrackInfo
      }>
    }
  }

  return payload.data?.accepted?.[0]?.track_info || null
}

export function hasArrivedInNzSignal(fulfillment: ArrivedNzFulfillment): boolean {
  const orderMetadata = fulfillment.order?.metadata
  const fulfillmentMetadata = fulfillment.metadata
  const labels = fulfillment.labels || []

  const flagKeys = [
    "muse_arrived_nz",
    "muse_arrived_in_nz",
    "arrived_nz",
    "arrived_in_nz",
    "tracking_arrived_nz",
  ]

  if (metadataFlag(orderMetadata, flagKeys) || metadataFlag(fulfillmentMetadata, flagKeys)) {
    return true
  }

  const arrivalPhrases = [
    "arrived in new zealand",
    "arrived in nz",
    "arrived at new zealand",
    "arrived at nz",
    "arrival in destination country",
    "arrived at destination country",
    "arrived destination country",
    "landed in new zealand",
    "landed in nz",
    "with nz post",
    "nz post final delivery",
    ...NZ_ARRIVAL_EVENTS,
    ...NZ_LOCAL_EVENTS,
  ]

  if (metadataValueIncludes(orderMetadata, arrivalPhrases) || metadataValueIncludes(fulfillmentMetadata, arrivalPhrases)) {
    return true
  }

  return labels.some((label) => {
    if (metadataFlag(label.metadata, flagKeys) || metadataValueIncludes(label.metadata, arrivalPhrases)) {
      return true
    }

    const status = label.status?.toLowerCase() || ""
    return arrivalPhrases.some((phrase) => status.includes(phrase))
  })
}

export function buildOrderArrivedNzProps(
  order: ArrivedNzEmailOrder,
  label: ArrivedNzFulfillmentLabel
): OrderArrivedNzProps | null {
  if (!order.email) {
    return null
  }

  const trackingNumber = label.tracking_number?.trim()
  if (!trackingNumber) {
    return null
  }

  const { items: itemsWithoutProtection, protectionAmount } = splitShippingProtection(order.items || [])
  const safeItems = withSafePricing(itemsWithoutProtection, toNumber(order.item_total ?? order.total))

  const items: EmailItem[] = safeItems.map((item) => ({
    id: item.id,
    title: item.product_title,
    variantTitle: item.variant_title,
    quantity: toNumber(item.quantity) || 1,
    unitPrice: toNumber(item.unit_price),
    thumbnail: item.thumbnail,
    fulfillmentType: getFulfillmentType(item.metadata),
  }))

  const addressDetail = formatAddressLines(order.shipping_address)

  return {
    customerName: order.shipping_address?.first_name || "there",
    customerEmail: order.email,
    displayId: String(order.display_id),
    currencyCode: order.currency_code,
    shippingMethodLabel: getShippingMethodLabel(order.shipping_methods?.[0]?.name),
    trackingNumber,
    trackingUrl: getTrackingUrl(trackingNumber, label.tracking_url),
    addressLines: addressDetail.lines,
    phone: addressDetail.phone,
    items,
    subtotal: toNumber(order.item_total ?? order.total) - protectionAmount,
    shippingTotal: toNumber(order.shipping_total),
    shippingProtectionAmount: protectionAmount,
    discountTotal: toNumber(order.discount_total),
    taxTotal: toNumber(order.tax_total),
    total: toNumber(order.total),
  }
}

export async function fetchAuthoritativeArrivedNzOrderTotals(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  container: any,
  order: ArrivedNzEmailOrder
): Promise<ArrivedNzEmailOrder> {
  try {
    const orderModuleService = container.resolve(Modules.ORDER)
    const totals = await orderModuleService.retrieveOrder(order.id, {
      select: ["id", "item_total", "shipping_total", "discount_total", "tax_total", "total"],
    })

    return {
      ...order,
      item_total: totals.item_total,
      shipping_total: totals.shipping_total,
      discount_total: totals.discount_total,
      tax_total: totals.tax_total,
      total: totals.total,
    }
  } catch {
    return order
  }
}

export async function renderOrderArrivedNzEmail(
  order: ArrivedNzEmailOrder,
  label: ArrivedNzFulfillmentLabel
): Promise<string | null> {
  const props = buildOrderArrivedNzProps(order, label)
  if (!props) {
    return null
  }

  return pretty(await render(getOrderArrivedNzTemplate(props)))
}
