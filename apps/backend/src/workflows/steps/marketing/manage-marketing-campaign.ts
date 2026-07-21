import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"

export const manageMarketingCampaignStep = createStep("manage-marketing-campaign", async ({ campaign_id, action }: { campaign_id: string; action: "pause" | "resume" | "cancel" }, { container }) => {
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const campaign = await service.retrieveMarketingCampaign(campaign_id)
  if (["sent", "cancelled"].includes(campaign.status)) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Completed campaigns cannot be changed.")
  const status = action === "cancel" ? "cancelled" : action === "pause" ? "paused" : "scheduled"
  if (action === "resume" && !campaign.confirmed_at) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Campaign was not confirmed.")
  await service.updateMarketingCampaigns({ id: campaign.id, status })
  const recipients = await service.listMarketingCampaignRecipients({ campaign_id: campaign.id, status: ["scheduled", "eligible"] })
  const events = await service.listMarketingEmailEvents({ campaign_id: campaign.id, status: "scheduled" })
  if (action === "cancel") {
    if (recipients.length) await service.updateMarketingCampaignRecipients(recipients.map((item) => ({ id: item.id, status: "cancelled" as const, exclusion_reason: "campaign_cancelled" })))
    if (events.length) await service.updateMarketingEmailEvents(events.map((item) => ({ id: item.id, status: "cancelled" as const, cancelled_at: new Date(), last_error: "campaign_cancelled" })))
  }
  return new StepResponse({ id: campaign.id, status })
})
