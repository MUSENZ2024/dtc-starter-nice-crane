import type { LoaderOptions } from "@medusajs/framework/types"
import { defaultOrderConfirmationTemplate } from "../defaults"
import type EmailAutomationModuleService from "../service"

export default async function seedDefaultTemplate({ container }: LoaderOptions) {
  const service: EmailAutomationModuleService = container.resolve("emailAutomation")
  const templates = await service.listEmailTemplates({
    key: defaultOrderConfirmationTemplate.key,
  })

  if (!templates.length) {
    await service.createEmailTemplates(defaultOrderConfirmationTemplate)
  }
}
