import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"

export type RecordMarketingCaptureEventInput = {
  session_id_hash: string
  event_type: "eligible" | "popup_viewed" | "preference_selected" | "form_viewed" | "submitted" | "succeeded" | "dismissed" | "error"
  source: string
  preference?: "footwear" | "outerwear" | "restocks" | "everything"
  page_type: string
  device_type: "mobile" | "desktop"
}

export const recordMarketingCaptureEventStep = createStep(
  "record-marketing-capture-event",
  async (input: RecordMarketingCaptureEventInput, { container }) => {
    const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
    const recent = await service.listMarketingCaptureEvents(
      {
        session_id_hash: input.session_id_hash,
        occurred_at: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
      { take: 101 },
    )
    if (recent.length >= 100) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Event limit reached")
    }
    const event = await service.createMarketingCaptureEvents({
      ...input,
      preference: input.preference ?? null,
      occurred_at: new Date(),
    })
    return new StepResponse({ accepted: true }, event.id)
  },
  async (eventId: string | undefined, { container }) => {
    if (!eventId) return
    const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
    await service.deleteMarketingCaptureEvents(eventId)
  },
)
