import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { EMAIL_AUTOMATION_MODULE } from "../modules/email-automation"
import { getOrderConfirmationTemplate } from "../modules/email-automation/defaults"
import type EmailAutomationModuleService from "../modules/email-automation/service"
import { queueOrderConfirmationEmailWorkflow } from "../workflows/queue-order-confirmation-email"
import { sendOrderConfirmationEmailWorkflow } from "../workflows/send-order-confirmation-email"

export default async function orderPlacedEmailHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  try {
    const emailAutomation: EmailAutomationModuleService = container.resolve(
      EMAIL_AUTOMATION_MODULE
    )
    const template = await getOrderConfirmationTemplate(emailAutomation)

    if (!template.enabled) return

    if (template.delay_minutes <= 0) {
      await sendOrderConfirmationEmailWorkflow(container).run({
        input: { order_id: data.id, automated: true },
      })
    } else {
      await queueOrderConfirmationEmailWorkflow(container).run({
        input: { order_id: data.id },
      })
    }
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
