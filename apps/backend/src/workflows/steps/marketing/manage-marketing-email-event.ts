import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"

export const manageMarketingEmailEventStep = createStep("manage-marketing-email-event", async ({ id, action, confirmation }: { id: string; action: "retry" | "cancel"; confirmation: string }, { container }) => {
  const expected = action === "retry" ? "RETRY EMAIL" : "CANCEL EMAIL"
  if (confirmation !== expected) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Type ${expected} to confirm.`)
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const event = await service.retrieveMarketingEmailEvent(id, { relations: ["subscriber"] })
  if (action === "retry") {
    if (!['failed', 'cancelled'].includes(event.status) || event.attempt_count >= 3 || event.subscriber.status !== "subscribed") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This email event is not eligible for retry.")
    const updated = await service.updateMarketingEmailEvents({ id, status: "scheduled", scheduled_at: new Date(), failed_at: null, cancelled_at: null, last_error: null })
    return new StepResponse({ event: updated })
  }
  if (!['scheduled', 'failed'].includes(event.status)) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Only scheduled or failed events can be cancelled.")
  const updated = await service.updateMarketingEmailEvents({ id, status: "cancelled", cancelled_at: new Date(), last_error: "cancelled_by_admin" })
  return new StepResponse({ event: updated })
})
