import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import Stripe from "stripe"

type OrderLine = {
  product_title: string
  quantity: number
}

type AddressFields = {
  first_name?: string | null
  last_name?: string | null
  city?: string | null
  country_code?: string | null
}

const STRIPE_PAYMENT_METHOD_LABELS: Record<string, string> = {
  afterpay_clearpay: "Afterpay",
  klarna: "Klarna",
  affirm: "Affirm",
  link: "Link",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
}

// Same BigNumber-vs-plain-number pitfall documented in order-placed.ts —
// query.graph can hand back { numeric_, raw_, bignumber_ } objects instead
// of plain numbers for money/quantity fields.
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

function getShippingMethodLabel(shippingMethodName?: string | null): string {
  return shippingMethodName?.toLowerCase().includes("express") ? "Express Delivery" : "Standard Delivery"
}

// Customer names, emails, and product titles are free text and can contain
// &/</> — escape them so they can't break the surrounding HTML the Telegram
// message is built from (parse_mode: "HTML" in the provider's send()).
function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function formatDestination(address?: AddressFields | null): string {
  if (!address) {
    return "Unknown destination"
  }
  const country = address.country_code?.toUpperCase() === "NZ" ? "New Zealand" : address.country_code
  return [address.city, country].filter(Boolean).join(", ") || "Unknown destination"
}

// Trimmed copy of derivePaymentMethodLabel in order-placed.ts — same
// reasoning: payment.data.payment_method_types lists what Stripe was
// ALLOWED to offer, not what the customer actually chose, so the only
// reliable read is fetching the PaymentMethod by ID.
async function derivePaymentMethodLabel(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any
): Promise<string> {
  const payment = order?.payment_collections?.[0]?.payments?.[0]
  if (!payment) {
    return "Card"
  }

  const providerId: string | undefined = payment.provider_id
  const data = payment.data as Record<string, unknown> | undefined
  if (!providerId?.includes("stripe") || !data) {
    return "Card"
  }

  const paymentMethodId = typeof data.payment_method === "string" ? data.payment_method : undefined
  if (!paymentMethodId || !process.env.STRIPE_API_KEY) {
    return "Card"
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_API_KEY)
    const method = await stripe.paymentMethods.retrieve(paymentMethodId)
    if (method.type === "card" && method.card) {
      const brand = method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1)
      return `${brand} •••• ${method.card.last4}`
    }
    return STRIPE_PAYMENT_METHOD_LABELS[method.type] ?? "Card"
  } catch {
    return "Card"
  }
}

const ORDER_ALERT_FIELDS = [
  "id",
  "display_id",
  "email",
  "currency_code",
  "metadata",
  "items.product_title",
  "items.quantity",
  "shipping_address.first_name",
  "shipping_address.last_name",
  "shipping_address.city",
  "shipping_address.country_code",
  "shipping_methods.name",
  "payment_collections.payments.provider_id",
  "payment_collections.payments.data",
] as const

// A short retry for items only — the same order.placed/createRemoteLinkStep
// race order-placed.ts works around, trimmed down since this is an FYI ping,
// not the customer-facing confirmation.
async function fetchOrderWithRetry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  orderId: string,
  maxAttempts = 5,
  delayMs = 500
) {
  let lastOrder: any
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ORDER_ALERT_FIELDS as unknown as string[],
      filters: { id: orderId },
    })
    const order = orders[0]
    lastOrder = order
    if (order?.items?.length) {
      return order
    }
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  return lastOrder
}

export default async function orderPlacedOwnerAlertHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const chatId = process.env.TELEGRAM_CHAT_ID
  const ownerEmail = process.env.OWNER_ALERT_EMAIL

  if (!chatId && !ownerEmail) {
    return
  }

  try {
    const query = container.resolve("query")
    const order = (await fetchOrderWithRetry(query, data.id)) as
      | {
          id: string
          display_id: number | string
          email?: string | null
          currency_code: string
          metadata?: Record<string, unknown> | null
          items?: OrderLine[] | null
          shipping_address?: AddressFields | null
          shipping_methods?: { name?: string | null }[] | null
          payment_collections?: { payments?: { provider_id?: string | null; data?: Record<string, unknown> }[] }[] | null
        }
      | undefined

    if (!order) {
      throw new Error(`Order ${data.id} was not found.`)
    }

    // Totals computed via retrieveOrder() are reliable the moment the order
    // row exists — see fetchOrderTotals in order-placed.ts for why query.graph
    // alone isn't trusted for this.
    const orderModuleService = container.resolve(Modules.ORDER)
    const totals = await orderModuleService.retrieveOrder(order.id, {
      select: ["id", "total"],
    })

    const isMusePay = order.metadata?.muse_split_pay === "true"
    const customerName = [order.shipping_address?.first_name, order.shipping_address?.last_name]
      .filter(Boolean)
      .join(" ")
    const paymentMethodLabel = isMusePay ? "MUSE Pay" : await derivePaymentMethodLabel(order)

    const itemLines = (order.items || [])
      .map((item) => `• ${toNumber(item.quantity) || 1}x ${escapeHtml(item.product_title)}`)
      .join("\n")

    const adminBaseUrl = (process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
    const orderAdminUrl = `${adminBaseUrl}/app/orders/${encodeURIComponent(order.id)}`

    const text = [
      `🛒 <b>New order #${order.display_id}</b> — ${order.currency_code?.toUpperCase()} ${toNumber(totals.total).toFixed(2)}`,
      `👤 ${escapeHtml(customerName || "Guest")}${order.email ? ` · ${escapeHtml(order.email)}` : ""}`,
      `📍 ${escapeHtml(formatDestination(order.shipping_address))}`,
      `💳 ${escapeHtml(paymentMethodLabel)}`,
      `🚚 ${getShippingMethodLabel(order.shipping_methods?.[0]?.name)}`,
      "",
      "Items:",
      itemLines || "(items pending)",
      "",
      `🔗 <a href="${orderAdminUrl}">View order in Medusa Admin</a>`,
    ].join("\n")

    const notificationModule = container.resolve(Modules.NOTIFICATION)

    // Each channel is sent independently — a Telegram outage shouldn't
    // suppress the email alert, and vice versa.
    if (chatId) {
      try {
        await notificationModule.createNotifications({
          to: chatId,
          channel: "telegram",
          template: "new-order-owner-alert",
          content: { text },
        })
      } catch (error) {
        logger.error(
          `Telegram order alert failed for ${data.id}: ${
            error instanceof Error ? error.stack ?? error.message : String(error)
          }`
        )
      }
    }

    if (ownerEmail) {
      try {
        await notificationModule.createNotifications({
          to: ownerEmail,
          from: process.env.MUSE_EMAIL_FROM || "orders@musenz.com",
          channel: "email",
          template: "new-order-owner-alert",
          content: {
            subject: `New order #${order.display_id} — ${order.currency_code?.toUpperCase()} ${toNumber(totals.total).toFixed(2)}`,
            html: text.replace(/\n/g, "<br>"),
          },
        })
      } catch (error) {
        logger.error(
          `Owner email alert failed for ${data.id}: ${
            error instanceof Error ? error.stack ?? error.message : String(error)
          }`
        )
      }
    }
  } catch (error) {
    logger.error(
      `Owner order alert failed for ${data.id}: ${
        error instanceof Error ? error.stack ?? error.message : String(error)
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
