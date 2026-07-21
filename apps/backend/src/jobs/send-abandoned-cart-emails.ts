import type { MedusaContainer } from "@medusajs/framework/types"
import { ABANDONED_CART_MODULE } from "../modules/abandoned-cart"
import AbandonedCartModuleService from "../modules/abandoned-cart/service"
import type { AbandonedCartSnapshot } from "../lib/abandoned-cart-email"
import { scheduleAbandonedCartCampaignWorkflow } from "../workflows/schedule-abandoned-cart-campaign"
import { sendAbandonedCartEmailEventWorkflow } from "../workflows/send-abandoned-cart-email-event"

const PAGE_SIZE = 100
const FREE_SHIPPING_THRESHOLD = 200
const DEFAULT_LOOKBACK_DAYS = 7

function getLookbackDate(): Date {
  const configuredDays = Number(process.env.ABANDONED_CART_LOOKBACK_DAYS)
  const lookbackDays = Number.isFinite(configuredDays) && configuredDays > 0
    ? configuredDays
    : DEFAULT_LOOKBACK_DAYS

  return new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value
  if (value && typeof value === "object" && "numeric_" in value) {
    return Number((value as { numeric_: unknown }).numeric_) || 0
  }
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

type CartRecord = {
  id: string
  email?: string | null
  customer_id?: string | null
  currency_code?: string | null
  total?: unknown
  created_at?: string | Date | null
  updated_at: string | Date
  items?: Array<{
    id: string
    title?: string | null
    product_title?: string | null
    variant_title?: string | null
    quantity: unknown
    unit_price: unknown
    thumbnail?: string | null
  }> | null
  customer?: { id?: string; first_name?: string | null; last_name?: string | null } | null
  shipping_address?: Record<string, unknown> | null
  billing_address?: Record<string, unknown> | null
  shipping_methods?: unknown[] | null
  payment_collection?: Record<string, unknown> | null
}

async function getSegment(query: any, cart: CartRecord): Promise<"first_time" | "returning"> {
  const filters = cart.customer_id ? { customer_id: cart.customer_id } : { email: cart.email }
  const { metadata } = await query.graph({
    entity: "order",
    fields: ["id"],
    filters,
    pagination: { take: 1, skip: 0 },
  })
  return (metadata?.count || 0) > 0 ? "returning" : "first_time"
}

async function toSnapshot(query: any, cart: CartRecord): Promise<AbandonedCartSnapshot> {
  const total = toNumber(cart.total)
  const segment = await getSegment(query, cart)
  const firstName = typeof cart.shipping_address?.first_name === "string"
    ? cart.shipping_address.first_name
    : cart.customer?.first_name
  const lastName = typeof cart.shipping_address?.last_name === "string"
    ? cart.shipping_address.last_name
    : cart.customer?.last_name
  const customerName = [firstName, lastName].filter(Boolean).join(" ") || "Guest customer"

  return {
    cart_id: cart.id,
    email: cart.email!,
    customer_id: cart.customer_id || cart.customer?.id || null,
    customer_name: customerName,
    segment,
    checkout_stage: cart.shipping_address || cart.payment_collection ? "checkout" : "cart",
    currency_code: cart.currency_code || "nzd",
    total,
    item_count: (cart.items || []).reduce((sum, item) => sum + (toNumber(item.quantity) || 1), 0),
    free_shipping_qualified: total >= FREE_SHIPPING_THRESHOLD,
    free_shipping_remaining: Math.max(0, FREE_SHIPPING_THRESHOLD - total),
    created_at: cart.created_at ? new Date(cart.created_at).toISOString() : null,
    updated_at: new Date(cart.updated_at).toISOString(),
    shipping_address: cart.shipping_address,
    billing_address: cart.billing_address,
    shipping_methods: cart.shipping_methods,
    payment_collection: cart.payment_collection,
    items: (cart.items || []).map((item) => ({
      id: item.id,
      title: item.product_title || item.title || "MUSE item",
      variantTitle: item.variant_title,
      quantity: toNumber(item.quantity) || 1,
      unitPrice: toNumber(item.unit_price),
      thumbnail: item.thumbnail,
    })),
  }
}

export default async function sendAbandonedCartEmails(container: MedusaContainer) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")
  const service: AbandonedCartModuleService = container.resolve(ABANDONED_CART_MODULE)
  const cutoff = new Date(Date.now() - 60 * 60 * 1000)
  const lookback = getLookbackDate()
  let offset = 0
  let totalCount = 0
  let scheduled = 0
  let sent = 0
  let failed = 0

  do {
    const { data: carts, metadata } = await query.graph({
      entity: "cart",
      fields: [
        "id", "email", "customer_id", "currency_code", "total", "created_at", "updated_at",
        "items.id", "items.title", "items.product_title", "items.variant_title", "items.quantity", "items.unit_price", "items.thumbnail",
        "customer.id", "customer.first_name", "customer.last_name",
        "shipping_address.*", "billing_address.*", "shipping_methods.id", "shipping_methods.name", "shipping_methods.amount",
        "payment_collection.id", "payment_collection.status",
        "payment_collection.payment_sessions.id", "payment_collection.payment_sessions.provider_id", "payment_collection.payment_sessions.status",
      ],
      filters: {
        updated_at: { $lt: cutoff, $gte: lookback },
        email: { $ne: null },
        completed_at: null,
      },
      pagination: { skip: offset, take: PAGE_SIZE, order: { updated_at: "ASC" } },
    })
    totalCount = metadata?.count ?? 0

    for (const cart of carts as unknown as CartRecord[]) {
      if (!cart.email || !cart.items?.length) continue
      try {
        const snapshot = await toSnapshot(query, cart)
        const { result } = await scheduleAbandonedCartCampaignWorkflow(container).run({ input: { snapshot } })
        if ((result as { created: boolean }).created) scheduled += 1
      } catch (error) {
        logger.error(`Could not schedule abandoned cart ${cart.id}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    offset += PAGE_SIZE
  } while (offset < totalCount)

  const dueEvents = (await service.listAbandonedCartEmailEvents(
    { status: "scheduled" },
    { take: 500, order: { scheduled_at: "ASC" } }
  )).filter((event) => new Date(event.scheduled_at).getTime() <= Date.now())

  for (const event of dueEvents) {
    try {
      const { result } = await sendAbandonedCartEmailEventWorkflow(container).run({ input: { event_id: event.id } })
      if (result.sent) sent += 1
    } catch (error) {
      failed += 1
      logger.error(`Abandoned-cart event ${event.id} failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`)
    }
  }

  logger.info(`Abandoned-cart job finished: ${scheduled} campaigns scheduled, ${sent} emails sent, ${failed} failed.`)
}

export const config = {
  name: "send-abandoned-cart-emails",
  schedule: "*/15 * * * *",
}
