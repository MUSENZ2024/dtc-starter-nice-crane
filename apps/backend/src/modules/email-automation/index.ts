import { Module } from "@medusajs/framework/utils"
import seedDefaultTemplate from "./loaders/seed-default-template"
import EmailAutomationModuleService from "./service"

export const EMAIL_AUTOMATION_MODULE = "emailAutomation"

export default Module(EMAIL_AUTOMATION_MODULE, {
  service: EmailAutomationModuleService,
  loaders: [seedDefaultTemplate],
})
