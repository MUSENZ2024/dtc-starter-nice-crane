import { MedusaService } from "@medusajs/framework/utils"
import EmailTemplate from "./models/email-template"
import ScheduledEmail from "./models/scheduled-email"

class EmailAutomationModuleService extends MedusaService({
  EmailTemplate,
  ScheduledEmail,
}) {}

export default EmailAutomationModuleService
