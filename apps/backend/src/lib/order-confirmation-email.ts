type OrderItem = {
  id: string
  product_title: string
  variant_title?: string | null
  quantity: number
  unit_price: number
}

type EmailTemplate = {
  subject: string
  html: string
}

export type OrderEmailRecord = {
  id: string
  display_id: string | number
  currency_code: string
  email?: string | null
  customer?: {
    first_name?: string | null
    email?: string | null
  } | null
  items?: OrderItem[]
  total: number
  shipping_address?: {
    first_name?: string | null
  } | null
}

export const ORDER_EMAIL_FIELDS = [
  "id",
  "email",
  "display_id",
  "currency_code",
  "total",
  "customer.first_name",
  "customer.email",
  "items.id",
  "items.product_title",
  "items.variant_title",
  "items.quantity",
  "items.unit_price",
  "shipping_address.first_name",
] as const

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    }
    return replacements[character]
  })

const formatMoney = (amount: number, currencyCode: string) =>
  new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    currencyDisplay: "narrowSymbol",
  }).format(amount)

const replaceToken = (html: string, token: string, value: string) =>
  html.split(`{{${token}}}`).join(value)

const createOrderItemsHtml = (order: OrderEmailRecord) =>
  (order.items || [])
    .map((item) => {
      const variant = item.variant_title ? ` · ${item.variant_title}` : ""
      return `<div style="border-top:1px solid #e4e1db;padding:12px 0;"><p style="color:#151515;font-size:14px;font-weight:600;line-height:1.4;margin:0 0 3px;">${escapeHtml(item.product_title + variant)}</p><p style="color:#666666;font-size:13px;margin:0;">${item.quantity} × ${escapeHtml(formatMoney(item.unit_price, order.currency_code))}</p></div>`
    })
    .join("")

const createNoteHtml = (note?: string) => {
  if (!note) return ""
  return `<section style="border-left:3px solid #c8d241;margin:0 0 28px;padding:4px 0 4px 16px;"><p style="color:#777777;font-size:10px;font-weight:700;letter-spacing:.1em;margin:0 0 6px;">A NOTE FROM MUSE</p><p style="color:#2f2f2f;font-size:14px;line-height:1.55;margin:0;white-space:pre-line;">${escapeHtml(note)}</p></section>`
}

export const createOrderConfirmationEmail = async (
  order: OrderEmailRecord,
  template: EmailTemplate,
  note?: string
) => {
  const storefrontUrl = (
    process.env.MUSE_STOREFRONT_URL || "https://store.musenz.com"
  ).replace(/\/$/, "")
  const trackUrl = `${storefrontUrl}/nz/track`
  const firstName =
    order.customer?.first_name?.trim() ||
    order.shipping_address?.first_name?.trim() ||
    "there"
  const tokens: Record<string, string> = {
    customer_first_name: escapeHtml(firstName),
    order_number: escapeHtml(String(order.display_id)),
    order_items: createOrderItemsHtml(order),
    order_total: escapeHtml(formatMoney(order.total, order.currency_code)),
    payment_method: "your selected payment method",
    tracking_url: escapeHtml(trackUrl),
    personal_note: createNoteHtml(note),
  }
  const html = Object.entries(tokens).reduce(
    (output, [token, value]) => replaceToken(output, token, value),
    template.html
  )
  const subject = Object.entries(tokens).reduce(
    (output, [token, value]) => replaceToken(output, token, value.replace(/<[^>]+>/g, "")),
    template.subject
  )

  return {
    html,
    recipient: getOrderEmailRecipient(order)!,
    subject,
  }
}

export const getOrderEmailRecipient = (order: OrderEmailRecord) =>
  order.customer?.email?.trim() || order.email?.trim() || undefined
