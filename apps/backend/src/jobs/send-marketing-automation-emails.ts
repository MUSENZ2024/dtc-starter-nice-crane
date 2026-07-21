import type { MedusaContainer } from "@medusajs/framework/types"
import { MARKETING_MODULE } from "../modules/marketing"
import MarketingModuleService from "../modules/marketing/service"
import { sendMarketingEmailEventWorkflow } from "../workflows/marketing/send-marketing-email-event"

export default async function sendMarketingAutomationEmails(container: MedusaContainer) {
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const logger = container.resolve("logger")
  const events = await service.listMarketingEmailEvents({ status: "scheduled", scheduled_at: { $lte: new Date() } }, { take: 25, order: { scheduled_at: "ASC" } })
  for (const event of events) {
    try { await sendMarketingEmailEventWorkflow(container).run({ input: { event_id: event.id } }) }
    catch (error) { logger.error(`Marketing event ${event.id} failed: ${error instanceof Error ? error.message : String(error)}`) }
  }
}
export const config = { name: "send-marketing-automation-emails", schedule: "*/5 * * * *" }
