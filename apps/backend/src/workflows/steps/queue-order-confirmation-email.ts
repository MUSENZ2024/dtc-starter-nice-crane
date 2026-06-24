import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  getOrderConfirmationTemplate,
  ORDER_CONFIRMATION_TEMPLATE_KEY,
} from "../../modules/email-automation/defaults"
import { EMAIL_AUTOMATION_MODULE } from "../../modules/email-automation"
import type EmailAutomationModuleService from "../../modules/email-automation/service"

export type QueueOrderConfirmationEmailInput = {
  order_id: string
}

export const queueOrderConfirmationEmailStep = createStep(
  "queue-order-confirmation-email",
  async (input: QueueOrderConfirmationEmailInput, { container }) => {
    const emailAutomation: EmailAutomationModuleService = container.resolve(
      EMAIL_AUTOMATION_MODULE
    )
    const template = await getOrderConfirmationTemplate(emailAutomation)

    if (!template?.enabled) {
      return new StepResponse({ queued: false })
    }

    const sendAt = new Date(
      Date.now() + Math.max(0, template.delay_minutes) * 60 * 1000
    )
    const scheduledEmail = await emailAutomation.createScheduledEmails({
      template_key: ORDER_CONFIRMATION_TEMPLATE_KEY,
      order_id: input.order_id,
      send_at: sendAt,
    })

    return new StepResponse({
      queued: true,
      scheduled_email_id: scheduledEmail.id,
      send_at: sendAt.toISOString(),
    })
  }
)
