import { Modules } from "@medusajs/framework/utils"
import { render, pretty } from "@react-email/render"
import type { EmailItem } from "../emails/OrderConfirmationTemplate"
import { resolveLineItemImage } from "./resolve-line-item-image"
import {
  MANUAL_ORDER_UPDATE_TEMPLATES,
  ManualOrderUpdateKey,
  ManualOrderUpdateProps,
} from "../emails/OrderManualUpdateTemplate"
import getOrderManualUpdateTemplate from "../emails/order-manual-update"
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
  variant?: {
    images?: { url?: string | null }[] | null
    product?: { thumbnail?: string | null } | null
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

export type ManualUpdateEmailOrder = {
  id: string
  email?: string | null
  display_id: number | string
  currency_code: string
  item_total?: number
  shipping_total?: number
  discount_total?: number
  tax_total?: number
  total: number
  items?: OrderLine[] | null
  shipping_methods?: { name?: string | null }[] | null
  shipping_address?: AddressFields | null
}

export const ORDER_MANUAL_UPDATE_FIELDS = [
  "id",
  "email",
  "display_id",
  "currency_code",
  "item_total",
  "shipping_total",
  "discount_total",
  "tax_total",
  "total",
  "items.id",
  "items.product_title",
  "items.variant_title",
  "items.variant_id",
  "items.quantity",
  "items.unit_price",
  "items.thumbnail",
  "items.metadata",
  "items.variant.images.url",
  "items.variant.product.thumbnail",
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

export const MANUAL_ORDER_UPDATE_TEMPLATE_OPTIONS = Object.entries(MANUAL_ORDER_UPDATE_TEMPLATES).map(
  ([key, template]) => ({
    key,
    label: template.label,
    subject: template.subject,
  })
)

export async function fetchAuthoritativeManualUpdateOrderTotals(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  container: any,
  order: ManualUpdateEmailOrder
): Promise<ManualUpdateEmailOrder> {
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

export function buildOrderManualUpdateProps(
  order: ManualUpdateEmailOrder,
  templateKey: ManualOrderUpdateKey,
  note?: string | null
): ManualOrderUpdateProps | null {
  if (!order.email) {
    return null
  }

  const { items: itemsWithoutProtection, protectionAmount } = splitShippingProtection(order.items || [])
  const safeItems = withSafePricing(itemsWithoutProtection, toNumber(order.item_total ?? order.total))
  const addressDetail = formatAddressLines(order.shipping_address)

  const items: EmailItem[] = safeItems.map((item) => ({
    id: item.id,
    title: item.product_title,
    variantTitle: item.variant_title,
    quantity: toNumber(item.quantity) || 1,
    unitPrice: toNumber(item.unit_price),
    thumbnail: resolveLineItemImage(item),
    fulfillmentType: getFulfillmentType(item.metadata),
  }))

  return {
    templateKey,
    customerName: order.shipping_address?.first_name || "there",
    customerEmail: order.email,
    displayId: String(order.display_id),
    currencyCode: order.currency_code,
    shippingMethodLabel: getShippingMethodLabel(order.shipping_methods?.[0]?.name),
    addressLines: addressDetail.lines,
    phone: addressDetail.phone,
    items,
    subtotal: toNumber(order.item_total ?? order.total) - protectionAmount,
    shippingTotal: toNumber(order.shipping_total),
    shippingProtectionAmount: protectionAmount,
    discountTotal: toNumber(order.discount_total),
    taxTotal: toNumber(order.tax_total),
    total: toNumber(order.total),
    note,
  }
}

export async function renderOrderManualUpdateEmail(
  order: ManualUpdateEmailOrder,
  templateKey: ManualOrderUpdateKey,
  note?: string | null
) {
  const props = buildOrderManualUpdateProps(order, templateKey, note)
  if (!props) {
    return null
  }

  return pretty(await render(getOrderManualUpdateTemplate(props)))
}
