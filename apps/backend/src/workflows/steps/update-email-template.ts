import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { EMAIL_AUTOMATION_MODULE } from "../../modules/email-automation"
import { defaultOrderConfirmationTemplate } from "../../modules/email-automation/defaults"
import type EmailAutomationModuleService from "../../modules/email-automation/service"

export type UpdateEmailTemplateInput = {
  key: string
  subject: string
  html: string
  enabled: boolean
  delay_minutes: number
}

export const updateEmailTemplateStep = createStep(
  "update-email-template",
  async (input: UpdateEmailTemplateInput, { container }) => {
    const emailAutomation: EmailAutomationModuleService = container.resolve(
      EMAIL_AUTOMATION_MODULE
    )
    const templates = await emailAutomation.listEmailTemplates({ key: input.key })
    const template = templates[0]

    const updated = template
      ? await emailAutomation.updateEmailTemplates({
          id: template.id,
          subject: input.subject,
          html: input.html,
          enabled: input.enabled,
          delay_minutes: input.delay_minutes,
        })
      : await emailAutomation.createEmailTemplates({
          ...defaultOrderConfirmationTemplate,
          key: input.key,
          subject: input.subject,
          html: input.html,
          enabled: input.enabled,
          delay_minutes: input.delay_minutes,
        })

    return new StepResponse(updated)
  }
)
