import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
import { renderCampaignEmail, type CampaignBlock } from "../../../lib/marketing-campaign-email"

export const testMarketingCampaignStep = createStep("test-marketing-campaign", async ({ campaign_id, to, confirmation }: { campaign_id: string; to: string; confirmation: string }, { container }) => {
  if (confirmation !== "SEND TEST") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Type SEND TEST to confirm.")
  if (!/^\S+@\S+\.\S+$/.test(to)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "A valid test recipient is required.")
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const campaign = await service.retrieveMarketingCampaign(campaign_id)
  const html = renderCampaignEmail({ subject: `[TEST] ${campaign.subject}`, previewText: campaign.preview_text, blocks: (campaign.content.blocks || []) as CampaignBlock[], unsubscribeUrl: `${process.env.STOREFRONT_URL || "http://localhost:8000"}/marketing/unsubscribe?preview=1`, utmCampaign: campaign.utm_campaign })
  const notifications = await container.resolve(Modules.NOTIFICATION).createNotifications({ to, from: campaign.sender, channel: "email", content: { subject: `[TEST] ${campaign.subject}`, html } })
  await service.updateMarketingCampaigns({ id: campaign.id, test_sent_at: new Date() })
  const notification = Array.isArray(notifications) ? notifications[0] : notifications
  return new StepResponse({ sent: true, recipient: to, notification_id: notification?.id || null })
})
