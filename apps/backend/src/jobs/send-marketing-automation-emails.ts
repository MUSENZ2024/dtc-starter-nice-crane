import type { MedusaContainer } from "@medusajs/framework/types"
import { MARKETING_MODULE } from "../modules/marketing"
import MarketingModuleService from "../modules/marketing/service"
import { createDefaultWelcomeFlowWorkflow } from "../workflows/marketing/create-default-welcome-flow"
import { createDefaultWelcomeOfferWorkflow } from "../workflows/marketing/create-default-welcome-offer"
import { enrollWelcomeFlowWorkflow } from "../workflows/marketing/enroll-welcome-flow"
import { issueWelcomeOfferWorkflow } from "../workflows/marketing/issue-welcome-offer"
import { sendMarketingEmailEventWorkflow } from "../workflows/marketing/send-marketing-email-event"
import { updateMarketingFlowStatusWorkflow } from "../workflows/marketing/update-marketing-flow-status"
import { updateMarketingOfferStatusWorkflow } from "../workflows/marketing/update-marketing-offer-status"

export default async function sendMarketingAutomationEmails(container: MedusaContainer) {
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const logger = container.resolve("logger")

  const { result: flowResult } = await createDefaultWelcomeFlowWorkflow(container).run()
  if (flowResult.created) {
    await updateMarketingFlowStatusWorkflow(container).run({
      input: { id: flowResult.flow.id, status: "active" },
    })
  }

  const { result: offerResult } = await createDefaultWelcomeOfferWorkflow(container).run()
  if (offerResult.created) {
    await updateMarketingOfferStatusWorkflow(container).run({
      input: { id: offerResult.offer.id, status: "active" },
    })
  }

  const pendingSubscribers = await service.listMarketingSubscribers(
    { status: "subscribed", customer_type: "unknown" },
    { take: 100, order: { subscribed_at: "ASC" } },
  )
  for (const subscriber of pendingSubscribers) {
    try {
      await issueWelcomeOfferWorkflow(container).run({ input: { subscriber_id: subscriber.id } })
      await enrollWelcomeFlowWorkflow(container).run({ input: { subscriber_id: subscriber.id } })
    } catch (error) {
      logger.error(
        `Marketing welcome enrollment ${subscriber.id} failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  const events = await service.listMarketingEmailEvents({ status: "scheduled", scheduled_at: { $lte: new Date() } }, { take: 25, order: { scheduled_at: "ASC" } })
  for (const event of events) {
    try { await sendMarketingEmailEventWorkflow(container).run({ input: { event_id: event.id } }) }
    catch (error) { logger.error(`Marketing event ${event.id} failed: ${error instanceof Error ? error.message : String(error)}`) }
  }
}
export const config = { name: "send-marketing-automation-emails", schedule: "*/5 * * * *" }
