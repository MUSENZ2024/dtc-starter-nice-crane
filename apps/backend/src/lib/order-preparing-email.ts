import { Modules } from "@medusajs/framework/utils"
import { render, pretty } from "@react-email/render"
import type { EmailItem } from "../emails/OrderConfirmationTemplate"
import type { OrderPreparingProps } from "../emails/OrderPreparingTemplate"
import getOrderPreparingTemplate from "../emails/order-preparing"
import { resolveLineItemImages } from "./resolve-line-item-image"

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
  variant?: {
    thumbnail?: string | null
    images?: { id?: string | null }[] | null
    product?: {
      id?: string | null
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

export type PreparingEmailOrder = {
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
  metadata?: Record<string, unknown> | null
  fulfillment_status?: string | null
  items?: OrderLine[] | null
  shipping_methods?: { name?: string | null }[] | null
  shipping_address?: AddressFields | null
}

export const ORDER_PREPARING_SENT_METADATA_KEY = "muse_order_preparing_email_sent_at"
export const ORDER_PREPARING_TEMPLATE_KEY = "order_preparing"
export const ORDER_PREPARING_SUBJECT = "MUSE NZ: Your order has been processed ⌛"

export const ORDER_PREPARING_FIELDS = [
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
  "fulfillment_status",
  "items.id",
  "items.product_title",
  "items.variant_title",
  "items.variant_id",
  "items.quantity",
  "items.unit_price",
  "items.thumbnail",
  "items.metadata",
  "items.variant.thumbnail",
  "items.variant.images.id",
  "items.variant.product.id",
  "items.variant.product.thumbnail",
  "items.variant.product.images.id",
  "items.variant.product.images.url",
  "items.variant.product.images.rank",
  "shipping_methods.name",
  "shipping_address.first_name",
  "shipping_address.last_name",
  "shipping_address.address_1",
  "shipping_address.address_2",
  "shipping_address.city",
  "shipping_address.province",
  "shipping_address.postal_code",
  "shipping_address.country_code",
  "shipping_address.phone",
] as const

const SHIPPING_PROTECTION_VARIANT_ID =
  process.env.SHIPPING_PROTECTION_VARIANT_ID || process.env.NEXT_PUBLIC_SHIPPING_PROTECTION_VARIANT_ID

export function formatAddressLines(address?: AddressFields | null): { lines: string[]; phone: string | null } {
  const lines = [
    [address?.first_name, address?.last_name].filter(Boolean).join(" "),
    address?.address_1,
    address?.address_2,
    [address?.city, address?.province, address?.postal_code].filter(Boolean).join(" "),
    address?.country_code?.toUpperCase() === "NZ" ? "New Zealand" : address?.country_code,
  ].filter((line): line is string => Boolean(line))

  return { lines: lines.length ? lines : ["Your delivery address"], phone: address?.phone || null }
}

export function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value
  }
  if (value && typeof value === "object" && "numeric_" in (value as Record<string, unknown>)) {
    return Number((value as { numeric_: unknown }).numeric_) || 0
  }
  const coerced = Number(value)
  return Number.isFinite(coerced) ? coerced : 0
}

function isShippingProtectionLine(item: OrderLine): boolean {
  if (SHIPPING_PROTECTION_VARIANT_ID && item.variant_id === SHIPPING_PROTECTION_VARIANT_ID) {
    return true
  }
  return item.product_title?.trim().toLowerCase() === "shipping protection"
}

export function splitShippingProtection(items: OrderLine[]): { items: OrderLine[]; protectionAmount: number } {
  const protectionItem = items.find(isShippingProtectionLine)
  if (!protectionItem) {
    return { items, protectionAmount: 0 }
  }

  return {
    items: items.filter((item) => item.id !== protectionItem.id),
    protectionAmount: toNumber(protectionItem.unit_price) * (toNumber(protectionItem.quantity) || 1),
  }
}

export function getShippingMethodLabel(shippingMethodName?: string | null): string {
  return shippingMethodName?.toLowerCase().includes("express") ? "Express Delivery" : "Standard Delivery"
}

export const getFulfillmentType = (metadata?: Record<string, unknown> | null): FulfillmentType =>
  metadata?.fulfillment_type === "nzstock" ? "nzstock" : "standard"

export function withSafePricing(items: OrderLine[], itemTotal: number): OrderLine[] {
  const fallbackUnitPrice = items.length > 0 ? itemTotal / items.length : 0

  return items.map((item) => {
    const quantity = toNumber(item.quantity) || 1
    const unitPrice = item.unit_price == null ? fallbackUnitPrice : toNumber(item.unit_price)
    return { ...item, quantity, unit_price: unitPrice }
  })
}

export async function fetchAuthoritativeOrderTotals(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  container: any,
  order: PreparingEmailOrder
): Promise<PreparingEmailOrder> {
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

export async function buildOrderPreparingProps(
  order: PreparingEmailOrder,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any
): Promise<OrderPreparingProps | null> {
  if (!order.email) {
    return null
  }

  const { items: itemsWithoutProtection, protectionAmount } = splitShippingProtection(order.items || [])
  const safeItems = withSafePricing(itemsWithoutProtection, toNumber(order.item_total ?? order.total))
  const itemThumbnails = await resolveLineItemImages(safeItems, query)

  const items: EmailItem[] = safeItems.map((item) => ({
    id: item.id,
    title: item.product_title,
    variantTitle: item.variant_title,
    quantity: toNumber(item.quantity) || 1,
    unitPrice: toNumber(item.unit_price),
    thumbnail: itemThumbnails[item.id],
    fulfillmentType: getFulfillmentType(item.metadata),
  }))

  const addressDetail = formatAddressLines(order.shipping_address)
  const fulfillmentType = items.some((item) => item.fulfillmentType === "nzstock") ? "nzstock" : "standard"

  return {
    customerName: order.shipping_address?.first_name || "there",
    customerEmail: order.email,
    displayId: String(order.display_id),
    createdAt: order.created_at,
    currencyCode: order.currency_code,
    subtotal: toNumber(order.item_total ?? order.total) - protectionAmount,
    shippingTotal: toNumber(order.shipping_total),
    shippingProtectionAmount: protectionAmount,
    discountTotal: toNumber(order.discount_total),
    taxTotal: toNumber(order.tax_total),
    total: toNumber(order.total),
    shippingMethodLabel: getShippingMethodLabel(order.shipping_methods?.[0]?.name),
    addressLines: addressDetail.lines,
    phone: addressDetail.phone,
    items,
    fulfillmentType,
  }
}

export async function renderOrderPreparingEmail(
  order: PreparingEmailOrder,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any
): Promise<string | null> {
  const props = await buildOrderPreparingProps(order, query)
  if (!props) {
    return null
  }

  return pretty(await render(getOrderPreparingTemplate(props)))
}
