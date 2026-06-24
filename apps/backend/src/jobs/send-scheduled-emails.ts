import type { MedusaContainer } from "@medusajs/framework/types"
import { ORDER_CONFIRMATION_TEMPLATE_KEY } from "../modules/email-automation/defaults"
import { EMAIL_AUTOMATION_MODULE } from "../modules/email-automation"
import type EmailAutomationModuleService from "../modules/email-automation/service"
import { sendOrderConfirmationEmailWorkflow } from "../workflows/send-order-confirmation-email"

type ScheduledEmail = {
  id: string
  order_id: string
  note?: string | null
}

export default async function sendScheduledEmails(container: MedusaContainer) {
  const logger = container.resolve("logger")
  const emailAutomation: EmailAutomationModuleService = container.resolve(
    EMAIL_AUTOMATION_MODULE
  )
  const templates = await emailAutomation.listEmailTemplates({
    key: ORDER_CONFIRMATION_TEMPLATE_KEY,
  })

  if (!templates[0]?.enabled) return

  const scheduledEmails = (await emailAutomation.listScheduledEmails({
    status: "pending",
    send_at: { $lte: new Date() },
  } as never)) as ScheduledEmail[]

  for (const scheduledEmail of scheduledEmails) {
    try {
      const { result } = await sendOrderConfirmationEmailWorkflow(container).run({
        input: {
          order_id: scheduledEmail.order_id,
          note: scheduledEmail.note || undefined,
          automated: true,
        },
      })

      if (!result.skipped) {
        await emailAutomation.updateScheduledEmails({
          id: scheduledEmail.id,
          status: "sent",
          sent_at: new Date(),
          last_error: null,
        })
      }
    } catch (error) {
      logger.error(
        `Could not send scheduled email ${scheduledEmail.id}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }
}

export const config = {
  name: "send-scheduled-muse-emails",
  schedule: "* * * * *",
}
