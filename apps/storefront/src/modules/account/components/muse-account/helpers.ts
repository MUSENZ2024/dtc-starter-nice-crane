import { convertToLocale } from "@lib/util/money"
import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { HttpTypes } from "@medusajs/types"

export const getCustomerName = (customer: HttpTypes.StoreCustomer | null) => {
  const name = [customer?.first_name, customer?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()

  return name || customer?.email || "MUSE customer"
}

export const getAvatarLetter = (customer: HttpTypes.StoreCustomer | null) =>
  (customer?.first_name?.[0] || customer?.email?.[0] || "M").toUpperCase()

export const getProfileCompletion = (
  customer: HttpTypes.StoreCustomer | null
) => {
  if (!customer) {
    return 0
  }

  const checks = [
    Boolean(customer.first_name),
    Boolean(customer.last_name),
    Boolean(customer.email),
    Boolean(customer.phone),
    Boolean(customer.addresses?.some((a) => a.is_default_shipping)),
    Boolean(customer.addresses?.some((a) => a.is_default_billing)),
  ]

  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export const formatDate = (date?: string | Date | null) => {
  if (!date) {
    return ""
  }

  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

export const formatMoney = (
  amount?: number | null,
  currencyCode: string = "nzd"
) =>
  convertToLocale({
    amount: amount ?? 0,
    currency_code: currencyCode,
  })

export const formatStatus = (value?: string | null) => {
  if (!value) {
    return "Processing"
  }

  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

type PaymentLike = {
  provider_id?: string
  data?: Record<string, unknown> | null
}

type FulfillmentLabelLike = {
  tracking_number?: string | null
  tracking_url?: string | null
  label_url?: string | null
  status?: string | null
}

type FulfillmentLike = {
  labels?: FulfillmentLabelLike[] | null
}

const formatWords = (value?: string | null, fallback = "") => {
  if (!value) {
    return fallback
  }

  return value
    .replace(/^pp_/, "")
    .replace(/_stripe$/, "")
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

const formatCardBrand = (brand?: unknown) =>
  typeof brand === "string" && brand.length > 0
    ? formatWords(brand, "Card")
    : "Card"

const getPaymentDataString = (
  data: Record<string, unknown> | null | undefined,
  keys: string[]
) => {
  for (const key of keys) {
    const value = data?.[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return undefined
}

export const getPaymentDisplay = (payment?: PaymentLike) => {
  if (!payment) {
    return "Payment confirmed"
  }

  const data = payment.data
  const last4 = getPaymentDataString(data, [
    "card_last4",
    "last4",
    "display_number",
  ])
  const brand = getPaymentDataString(data, ["card_brand", "brand"])
  const paymentType = getPaymentDataString(data, [
    "payment_method_type",
    "type",
    "payment_type",
  ])

  if (last4 && (isStripeLike(payment.provider_id) || brand)) {
    return `${formatCardBrand(brand)} ending ${last4}`
  }

  if (paymentType === "afterpay_clearpay") {
    return "Afterpay"
  }

  if (paymentType) {
    return formatWords(paymentType, "Payment confirmed")
  }

  return paymentInfoMap[payment.provider_id || ""]?.title || "Payment confirmed"
}

export const getPaymentStatusDisplay = (value?: string | null) => {
  if (value === "captured" || value === "authorized") {
    return "Paid"
  }

  if (value === "partially_refunded") {
    return "Partially refunded"
  }

  if (value === "refunded") {
    return "Refunded"
  }

  if (value === "canceled" || value === "cancelled") {
    return "Cancelled"
  }

  return formatStatus(value || "pending")
}

export const getOrderStatus = (order: HttpTypes.StoreOrder) => {
  const fulfillmentStatus = order.fulfillment_status
  const tracking = getOrderTracking(order)

  if (fulfillmentStatus === "delivered") {
    return { label: "Delivered", className: "muse-status-delivered" }
  }

  if (tracking.length > 0) {
    return { label: "Tracking available", className: "muse-status-transit" }
  }

  if (
    fulfillmentStatus === "shipped" ||
    fulfillmentStatus === "partially_shipped" ||
    fulfillmentStatus === "fulfilled"
  ) {
    return { label: "In transit", className: "muse-status-transit" }
  }

  return { label: "Processing", className: "muse-status-processing" }
}

export const getPrimaryOrderItem = (order: HttpTypes.StoreOrder) =>
  order.items?.[0]

export const getItemMeta = (item?: HttpTypes.StoreOrderLineItem | null) => {
  if (!item) {
    return ""
  }

  const variantTitle = item.variant?.title || undefined
  const sizeLabel = variantTitle ? `Size ${variantTitle}` : undefined
  const quantityLabel =
    item.quantity && item.quantity > 1 ? `Quantity ${item.quantity}` : undefined

  return [sizeLabel, quantityLabel].filter(Boolean).join(" · ")
}

export const getOrderTracking = (order: HttpTypes.StoreOrder) => {
  const fulfillments = (order as unknown as {
    fulfillments?: FulfillmentLike[] | null
  }).fulfillments

  return (fulfillments || [])
    .flatMap((fulfillment) => fulfillment.labels || [])
    .map((label) => {
      const number = label.tracking_number?.trim()
      if (!number) {
        return null
      }

      return {
        number,
        url:
          label.tracking_url ||
          label.label_url ||
          `/nz/track?number=${encodeURIComponent(number)}`,
        status: label.status ? formatStatus(label.status) : undefined,
      }
    })
    .filter(Boolean) as Array<{ number: string; url: string; status?: string }>
}

export const getAddressLines = (
  address?: HttpTypes.StoreCustomerAddress | HttpTypes.StoreOrderAddress | null
) => {
  if (!address) {
    return []
  }

  return [
    address.address_1,
    address.address_2,
    [address.city, address.postal_code].filter(Boolean).join(" "),
    address.country_code?.toUpperCase() === "NZ"
      ? "New Zealand"
      : address.country_code?.toUpperCase(),
  ].filter(Boolean)
}
