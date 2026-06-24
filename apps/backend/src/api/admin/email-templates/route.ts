import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { EMAIL_AUTOMATION_MODULE } from "../../../modules/email-automation"
import type EmailAutomationModuleService from "../../../modules/email-automation/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const emailAutomation: EmailAutomationModuleService = req.scope.resolve(
    EMAIL_AUTOMATION_MODULE
  )
  const templates = await emailAutomation.listEmailTemplates({}, {
    order: { name: "ASC" },
  })

  res.json({ templates })
}
