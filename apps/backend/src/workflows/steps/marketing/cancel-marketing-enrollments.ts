import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"

export const cancelMarketingEnrollmentsStep = createStep("cancel-marketing-enrollments", async ({ subscriber_id, reason, order_id }: { subscriber_id: string; reason: "purchased" | "unsubscribed" | "suppressed"; order_id?: string; dependency?: unknown }, { container }) => {
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const enrollments = await service.listMarketingEnrollments({ subscriber_id, status: "active" })
  if (!enrollments.length) return new StepResponse({ cancelled: 0 })
  const now = new Date()
  const events = await service.listMarketingEmailEvents({ enrollment_id: enrollments.map((item) => item.id), status: "scheduled" })
  if (events.length) await service.updateMarketingEmailEvents(events.map((event) => ({ id: event.id, status: "cancelled" as const, cancelled_at: now, last_error: reason })))
  await service.updateMarketingEnrollments(enrollments.map((item) => ({ id: item.id, status: (reason === "purchased" ? "converted" : reason) as "converted" | "unsubscribed" | "suppressed", cancelled_at: now, cancel_reason: reason, converted_at: reason === "purchased" ? now : null, converted_order_id: order_id || null })))
  return new StepResponse({ cancelled: enrollments.length, events: events.length })
})
