import crypto from "node:crypto"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
import { estimateSegment, materializeAudience, type SegmentDefinition } from "../../../lib/marketing-segments"
import { aucklandDateKey } from "../../../lib/marketing-reporting"
import { validateCampaignContent } from "../../../lib/marketing-campaign-email"

export type ScheduleCampaignInput = { campaign_id: string; scheduled_at: string; confirmation: string; override_allowance?: boolean }
export const scheduleMarketingCampaignStep = createStep("schedule-marketing-campaign", async (input: ScheduleCampaignInput, { container }) => {
  if (input.confirmation !== "CONFIRM CAMPAIGN") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Type CONFIRM CAMPAIGN to materialise and schedule this audience.")
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const campaign = await service.retrieveMarketingCampaign(input.campaign_id)
  if (campaign.status !== "draft" && campaign.status !== "paused") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Campaign must be draft or paused.")
  if (!campaign.test_sent_at) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "A successful test send is required before scheduling.")
  if (validateCampaignContent(campaign.content.blocks).length || !campaign.subject || !campaign.preview_text) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Campaign content, subject and preview text must be valid.")
  const scheduledAt = new Date(input.scheduled_at)
  if (!Number.isFinite(scheduledAt.getTime()) || scheduledAt <= new Date()) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Schedule time must be in the future.")
  const existing = await service.listMarketingCampaignRecipients({ campaign_id: campaign.id }, { take: 1 })
  if (existing.length) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Audience is already materialised and cannot be changed.")
  let [control] = await service.listMarketingControls({ key: "global" }, { take: 1 })
  if (!control) control = await service.createMarketingControls({ key: "global", global_pause: false, monthly_safety_limit: 9000, daily_dispatch_cap: 1350, frequency_days: 3 })
  const [subscribers, emails, issuances, enrollments, recipients] = await Promise.all([service.listMarketingSubscribers({}, { take: 100000 }), service.listMarketingEmailEvents({}, { take: 100000 }), service.listMarketingOfferIssuances({}, { take: 100000 }), service.listMarketingEnrollments({}, { take: 100000 }), service.listMarketingCampaignRecipients({}, { take: 100000 })])
  const matched = new Set(estimateSegment(subscribers, campaign.audience_definition as SegmentDefinition, { emailEvents: emails, issuances, enrollments, recipients }).map((item) => item.id))
  const cutoff = Date.now() - control.frequency_days * 86400000
  const recentlySent = new Set(emails.filter((event) => event.sent_at && new Date(event.sent_at).getTime() >= cutoff && event.campaign_id).map((event) => event.subscriber_id))
  const snapshot = materializeAudience({ subscribers, matchedIds: matched, recentlySentIds: recentlySent, campaignId: campaign.id })
  const eligible = snapshot.filter((item) => item.status === "scheduled")
  const month = aucklandDateKey(scheduledAt).slice(0, 7)
  const monthSent = emails.filter((item) => item.sent_at && aucklandDateKey(item.sent_at).startsWith(month)).length
  if (monthSent + eligible.length > control.monthly_safety_limit && !input.override_allowance) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Projected monthly usage exceeds the configured safety limit.")
  if (eligible.length > control.daily_dispatch_cap && !input.override_allowance) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Campaign exceeds the daily marketing dispatch cap.")
  const created = snapshot.length ? await service.createMarketingCampaignRecipients(snapshot) : []
  const bySubscriber = new Map((Array.isArray(created) ? created : [created]).map((item) => [item.subscriber_id, item]))
  if (eligible.length) await service.createMarketingEmailEvents(eligible.map((item) => ({ subscriber_id: item.subscriber_id, campaign_id: campaign.id, enrollment_id: null, flow_step_id: null, template_key: campaign.template_key, subject_snapshot: campaign.subject, preview_text_snapshot: campaign.preview_text, status: "scheduled" as const, scheduled_at: scheduledAt, tracking_token: crypto.randomBytes(24).toString("base64url"), content_snapshot: campaign.content, metadata: { campaign_recipient_id: bySubscriber.get(item.subscriber_id)?.id, utm_campaign: campaign.utm_campaign } })))
  const updated = await service.updateMarketingCampaigns({ id: campaign.id, status: "scheduled", scheduled_at: scheduledAt, confirmed_at: new Date(), audience_snapshot_count: eligible.length, excluded_snapshot_count: snapshot.length - eligible.length })
  return new StepResponse({ campaign: updated, eligible: eligible.length, excluded: snapshot.length - eligible.length, scheduled_local: scheduledAt.toLocaleString("en-NZ", { timeZone: "Pacific/Auckland" }), scheduled_utc: scheduledAt.toISOString(), projected_month_sends: monthSent + eligible.length })
})
