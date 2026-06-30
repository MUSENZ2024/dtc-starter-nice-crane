import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  fetchAuthoritativeOrderTotals,
  ORDER_PREPARING_FIELDS,
  ORDER_PREPARING_SENT_METADATA_KEY,
  ORDER_PREPARING_SUBJECT,
  PreparingEmailOrder,
  renderOrderPreparingEmail,
} from "../lib/order-preparing-email"

const HOURS_AFTER_ORDER = 36
const LOOKBACK_DAYS = 7
const MAX_ORDERS_PER_RUN = 50

const hoursAgo = (hours: number) => {
  const date = new Date()
  date.setHours(date.getHours() - hours)
  return date
}

const daysAgo = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

function alreadySent(order: PreparingEmailOrder): boolean {
  return Boolean(order.metadata?.[ORDER_PREPARING_SENT_METADATA_KEY])
}

function shouldSkipFulfillmentStatus(status?: string | null): boolean {
  return status === "shipped" || status === "delivered" || status === "fulfilled"
}

export default async function sendOrderPreparingEmails(container: MedusaContainer) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")
  const notificationModule = container.resolve("notification")
  const orderModuleService = container.resolve(Modules.ORDER)

  const sendBefore = hoursAgo(HOURS_AFTER_ORDER)
  const sendAfter = daysAgo(LOOKBACK_DAYS)

  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ORDER_PREPARING_FIELDS as unknown as string[],
      filters: {
        created_at: {
          $lte: sendBefore.toISOString(),
          $gte: sendAfter.toISOString(),
        },
      },
      pagination: {
        take: MAX_ORDERS_PER_RUN,
        order: {
          created_at: "ASC",
        },
      },
    })

    let sent = 0

    for (const rawOrder of orders as PreparingEmailOrder[]) {
      if (alreadySent(rawOrder) || shouldSkipFulfillmentStatus(rawOrder.fulfillment_status)) {
        continue
      }

      const order = await fetchAuthoritativeOrderTotals(container, rawOrder)
      const html = await renderOrderPreparingEmail(order)

      if (!html || !order.email) {
        logger.warn(`Skipping preparing email for ${order.id}: missing email or renderable template props.`)
        continue
      }

      await notificationModule.createNotifications({
        to: order.email,
        from: process.env.MUSE_EMAIL_FROM || "orders@musenz.com",
        channel: "email",
        content: {
          html,
          subject: ORDER_PREPARING_SUBJECT,
        },
      })

      await orderModuleService.updateOrders(order.id, {
        metadata: {
          ...(order.metadata || {}),
          [ORDER_PREPARING_SENT_METADATA_KEY]: new Date().toISOString(),
        },
      })

      sent += 1
    }

    if (sent > 0) {
      logger.info(`Sent ${sent} order preparing email${sent === 1 ? "" : "s"}.`)
    }
  } catch (error) {
    logger.error(
      `Order preparing email job failed: ${
        error instanceof Error ? error.stack ?? error.message : String(error)
      }`
    )
  }
}

export const config = {
  name: "send-order-preparing-emails",
  schedule: "0 * * * *",
}
