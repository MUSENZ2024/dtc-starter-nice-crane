import { randomBytes } from "node:crypto"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
import { createMarketingToken } from "../../../lib/marketing-consent"
import { discoverySubject, WELCOME_FLOW_KEY } from "../../../modules/marketing/welcome-flow"
import type { MarketingSource } from "../../../modules/marketing/types"

export const enrollWelcomeFlowStep = createStep("enroll-welcome-flow", async ({ subscriber_id }: { subscriber_id: string; issue_result?: unknown }, { container }) => {
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const subscriber = await service.retrieveMarketingSubscriber(subscriber_id)
  const [flow] = await service.listMarketingFlows({ key: WELCOME_FLOW_KEY, status: "active" }, { take: 1 })
  const [issuance] = await service.listMarketingOfferIssuances({ subscriber_id, status: "active" }, { take: 1, order: { issued_at: "DESC" } })
  if (!flow || !issuance || subscriber.status !== "subscribed") return new StepResponse({ status: "ineligible" }, {})
  const [existing] = await service.listMarketingEnrollments({ subscriber_id, flow_id: flow.id, flow_version: flow.version }, { take: 1 })
  if (existing) return new StepResponse({ status: "already_enrolled", enrollment: existing }, {})
  const enteredAt = new Date()
  const enrollment = await service.createMarketingEnrollments({ subscriber_id, flow_id: flow.id, flow_version: flow.version, status: "active", entered_at: enteredAt, source: subscriber.source_latest as MarketingSource, metadata: { offer_issuance_id: issuance.id } })
  const steps = await service.listMarketingFlowSteps({ flow_id: flow.id, status: "active" }, { order: { sequence_number: "ASC" } })
  const unsubscribeToken = createMarketingToken(subscriber.id)
  const events = await service.createMarketingEmailEvents(steps.map((step) => ({
    subscriber_id, enrollment_id: enrollment.id, flow_step_id: step.id, template_key: step.template_key,
    subject_snapshot: step.sequence_number === 3 ? discoverySubject(subscriber.primary_preference) : step.subject,
    preview_text_snapshot: step.preview_text, status: "scheduled" as const,
    scheduled_at: new Date(enteredAt.getTime() + step.delay_minutes * 60_000),
    tracking_token: randomBytes(24).toString("base64url"),
    content_snapshot: { code: issuance.code, expires_at: issuance.expires_at, preference: subscriber.primary_preference, unsubscribe_token: unsubscribeToken },
    metadata: { flow_version: flow.version },
  })))
  return new StepResponse({ status: "enrolled", enrollment, events }, { enrollment_id: enrollment.id, event_ids: events.map((event) => event.id) })
}, async (data: { enrollment_id?: string; event_ids?: string[] } | undefined, { container }) => {
  if (!data?.enrollment_id) return
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  if (data.event_ids?.length) await service.deleteMarketingEmailEvents(data.event_ids)
  await service.deleteMarketingEnrollments(data.enrollment_id)
})
