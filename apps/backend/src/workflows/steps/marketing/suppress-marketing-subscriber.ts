import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
import { MARKETING_CONSENT_TEXT, MARKETING_PRIVACY_POLICY_VERSION } from "../../../lib/marketing-consent"

export const suppressMarketingSubscriberStep = createStep("suppress-marketing-subscriber", async ({ id, reason, confirmation }: { id: string; reason: string; confirmation: string }, { container }) => {
  if (confirmation !== "SUPPRESS") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Type SUPPRESS to confirm.")
  const cleanReason = reason.trim().slice(0, 240)
  if (cleanReason.length < 3) throw new MedusaError(MedusaError.Types.INVALID_DATA, "A suppression reason is required.")
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const subscriber = await service.retrieveMarketingSubscriber(id)
  if (subscriber.status === "suppressed") return new StepResponse({ subscriber, changed: false })
  const now = new Date()
  const updated = await service.updateMarketingSubscribers({ id, status: "suppressed", suppressed_at: now, suppression_reason: cleanReason })
  await service.createMarketingConsentEvents({ subscriber_id: id, action: "suppressed", channel: "email", source: "admin_manual", consent_text: MARKETING_CONSENT_TEXT, privacy_policy_version: MARKETING_PRIVACY_POLICY_VERSION, occurred_at: now, metadata: { reason: cleanReason } })
  const enrollments = await service.listMarketingEnrollments({ subscriber_id: id, status: "active" })
  if (enrollments.length) {
    const events = await service.listMarketingEmailEvents({ enrollment_id: enrollments.map((item) => item.id), status: "scheduled" })
    if (events.length) await service.updateMarketingEmailEvents(events.map((event) => ({ id: event.id, status: "cancelled" as const, cancelled_at: now, last_error: "suppressed" })))
    await service.updateMarketingEnrollments(enrollments.map((item) => ({ id: item.id, status: "suppressed" as const, cancelled_at: now, cancel_reason: "suppressed" })))
  }
  return new StepResponse({ subscriber: updated, changed: true })
})
