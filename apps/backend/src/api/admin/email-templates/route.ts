import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { EMAIL_AUTOMATION_MODULE } from "../../../modules/email-automation"
import { getOrderConfirmationTemplate } from "../../../modules/email-automation/defaults"
import type EmailAutomationModuleService from "../../../modules/email-automation/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const emailAutomation: EmailAutomationModuleService = req.scope.resolve(
    EMAIL_AUTOMATION_MODULE
  )
  const template = await getOrderConfirmationTemplate(emailAutomation)

  res.json({ templates: [template] })
}
