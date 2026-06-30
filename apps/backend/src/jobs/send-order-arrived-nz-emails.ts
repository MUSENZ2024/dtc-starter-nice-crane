import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  ArrivedNzFulfillment,
  fetchAuthoritativeArrivedNzOrderTotals,
  hasArrivedInNzSignal,
  ORDER_ARRIVED_NZ_FULFILLMENT_FIELDS,
  ORDER_ARRIVED_NZ_SENT_METADATA_KEY,
  ORDER_ARRIVED_NZ_SUBJECT,
  renderOrderArrivedNzEmail,
} from "../lib/order-arrived-nz-email"

const LOOKBACK_DAYS = 45
const MAX_FULFILLMENTS_PER_RUN = 100

const daysAgo = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

function alreadySent(fulfillment: ArrivedNzFulfillment): boolean {
  return Boolean(fulfillment.order?.metadata?.[ORDER_ARRIVED_NZ_SENT_METADATA_KEY])
}

export default async function sendOrderArrivedNzEmails(container: MedusaContainer) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")
  const notificationModule = container.resolve("notification")
  const orderModuleService = container.resolve(Modules.ORDER)

  try {
    const { data: fulfillments } = await query.graph({
      entity: "fulfillment",
      fields: ORDER_ARRIVED_NZ_FULFILLMENT_FIELDS as unknown as string[],
      filters: {
        created_at: {
          $gte: daysAgo(LOOKBACK_DAYS).toISOString(),
        },
      },
      pagination: {
        take: MAX_FULFILLMENTS_PER_RUN,
        order: {
          created_at: "DESC",
        },
      },
    })

    let sent = 0

    for (const fulfillment of fulfillments as ArrivedNzFulfillment[]) {
      const order = fulfillment.order
      const label = fulfillment.labels?.find((entry) => entry.tracking_number?.trim())

      if (!order || !label?.tracking_number || alreadySent(fulfillment)) {
        continue
      }

      if (!hasArrivedInNzSignal(fulfillment)) {
        continue
      }

      const orderWithTotals = await fetchAuthoritativeArrivedNzOrderTotals(container, order)
      const html = await renderOrderArrivedNzEmail(orderWithTotals, label)

      if (!html || !orderWithTotals.email) {
        logger.warn(`Skipping arrived-in-NZ email for ${order.id}: missing email, tracking, or renderable props.`)
        continue
      }

      await notificationModule.createNotifications({
        to: orderWithTotals.email,
        from: process.env.MUSE_EMAIL_FROM || "orders@musenz.com",
        channel: "email",
        content: {
          html,
          subject: ORDER_ARRIVED_NZ_SUBJECT,
        },
      })

      await orderModuleService.updateOrders(order.id, {
        metadata: {
          ...(order.metadata || {}),
          [ORDER_ARRIVED_NZ_SENT_METADATA_KEY]: new Date().toISOString(),
        },
      })

      sent += 1
    }

    if (sent > 0) {
      logger.info(`Sent ${sent} arrived-in-NZ email${sent === 1 ? "" : "s"}.`)
    }
  } catch (error) {
    logger.error(
      `Arrived-in-NZ email job failed: ${
        error instanceof Error ? error.stack ?? error.message : String(error)
      }`
    )
  }
}

export const config = {
  name: "send-order-arrived-nz-emails",
  schedule: "*/30 * * * *",
}
