import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
import { aucklandDateKey } from "../../../lib/marketing-reporting"
import { renderCampaignEmail, type CampaignBlock } from "../../../lib/marketing-campaign-email"

export const dispatchMarketingCampaignsStep = createStep("dispatch-marketing-campaigns", async (_input: Record<string, never>, { container }) => {
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const logger = container.resolve("logger")
  const [control] = await service.listMarketingControls({ key: "global" }, { take: 1 })
  if (control?.global_pause) return new StepResponse({ paused: true, sent: 0, failed: 0 })
  const now = new Date()
  const todaySent = (await service.listMarketingEmailEvents({ status: ["sent", "delivered", "opened", "clicked"], sent_at: { $gte: new Date(`${aucklandDateKey(now)}T00:00:00+12:00`) } }, { take: 100000 })).length
  let capacity = Math.max(0, (control?.daily_dispatch_cap || 1350) - todaySent)
  if (!capacity) return new StepResponse({ paused: false, sent: 0, failed: 0, cap_reached: true })
  const campaigns = await service.listMarketingCampaigns({ status: ["scheduled", "sending"], scheduled_at: { $lte: now }, confirmed_at: { $ne: null } }, { take: 20, order: { scheduled_at: "ASC" } })
  let sent = 0, failed = 0
  for (const campaign of campaigns) {
    if (campaign.status === "scheduled") await service.updateMarketingCampaigns({ id: campaign.id, status: "sending", started_at: now })
    const recipients = await service.listMarketingCampaignRecipients({ campaign_id: campaign.id, status: "scheduled" }, { take: Math.min(capacity, 100), relations: ["subscriber"] })
    for (const recipient of recipients) {
      if (!capacity) break
      const [event] = await service.listMarketingEmailEvents({ campaign_id: campaign.id, subscriber_id: recipient.subscriber_id, status: "scheduled" }, { take: 1 })
      if (!event) { await service.updateMarketingCampaignRecipients({ id: recipient.id, status: "failed", exclusion_reason: "missing_email_event" }); failed++; continue }
      try {
        await service.updateMarketingEmailEvents({ id: event.id, status: "sending", send_started_at: new Date(), attempt_count: event.attempt_count + 1 })
        const html = renderCampaignEmail({ subject: campaign.subject, previewText: campaign.preview_text, blocks: (campaign.content.blocks || []) as CampaignBlock[], unsubscribeUrl: `${process.env.STOREFRONT_URL || "http://localhost:8000"}/marketing/unsubscribe?token=${event.tracking_token}`, utmCampaign: campaign.utm_campaign })
        const notifications = await container.resolve(Modules.NOTIFICATION).createNotifications({ to: recipient.email, from: process.env.MUSE_EMAIL_FROM || "MUSE NZ <orders@musenz.com>", channel: "email", content: { subject: campaign.subject, html } })
        const notification = Array.isArray(notifications) ? notifications[0] : notifications
        await service.updateMarketingEmailEvents({ id: event.id, status: "sent", sent_at: new Date(), provider_notification_id: notification?.id || null })
        await service.updateMarketingCampaignRecipients({ id: recipient.id, status: "sent", email_event_id: event.id })
        sent++; capacity--
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        await service.updateMarketingEmailEvents({ id: event.id, status: "failed", failed_at: new Date(), last_error: message })
        await service.updateMarketingCampaignRecipients({ id: recipient.id, status: "failed", exclusion_reason: "send_failed" })
        logger.error(`Campaign ${campaign.id} recipient ${recipient.id} failed: ${message}`); failed++
      }
    }
    const remaining = await service.listMarketingCampaignRecipients({ campaign_id: campaign.id, status: "scheduled" }, { take: 1 })
    if (!remaining.length) await service.updateMarketingCampaigns({ id: campaign.id, status: failed ? "failed" : "sent", completed_at: new Date() })
  }
  return new StepResponse({ paused: false, sent, failed })
})
