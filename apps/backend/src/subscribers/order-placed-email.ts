import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { queueOrderConfirmationEmailWorkflow } from "../workflows/queue-order-confirmation-email"

export default async function orderPlacedEmailHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  try {
    await queueOrderConfirmationEmailWorkflow(container).run({
      input: { order_id: data.id },
    })
  } catch (error) {
    logger.error(
      `Could not send order confirmation for ${data.id}: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
