import { convertToLocale } from "@lib/util/money"
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

export const getOrderStatus = (order: HttpTypes.StoreOrder) => {
  const fulfillmentStatus = order.fulfillment_status

  if (fulfillmentStatus === "delivered") {
    return { label: "Delivered", className: "muse-status-delivered" }
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
    return "Qty 0"
  }

  const variantTitle = item.variant?.title || undefined

  return [variantTitle, `Qty ${item.quantity}`].filter(Boolean).join(" · ")
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
