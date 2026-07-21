import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
import { estimateSegment, type SegmentDefinition } from "../../../lib/marketing-segments"

export type SaveSegmentInput = { id?: string; key: string; name: string; description?: string | null; definition: SegmentDefinition }
export const saveMarketingSegmentStep = createStep("save-marketing-segment", async (input: SaveSegmentInput, { container }) => {
  if (!input.name.trim() || !input.key.trim() || !input.definition.rules?.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Segment name, key and at least one rule are required.")
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const [subscribers, emails, issuances, enrollments, recipients] = await Promise.all([service.listMarketingSubscribers({}, { take: 100000 }), service.listMarketingEmailEvents({}, { take: 100000 }), service.listMarketingOfferIssuances({}, { take: 100000 }), service.listMarketingEnrollments({}, { take: 100000 }), service.listMarketingCampaignRecipients({}, { take: 100000 })])
  const estimated_count = estimateSegment(subscribers, input.definition, { emailEvents: emails, issuances, enrollments, recipients }).length
  const data = { key: input.key, name: input.name, description: input.description || null, definition: input.definition, estimated_count, estimated_at: new Date(), status: "active" as const }
  if (input.id) { const updated = await service.updateMarketingSegments({ id: input.id, ...data }); return new StepResponse<{ segment: any }, { created_id: string | null }>({ segment: Array.isArray(updated) ? updated[0] : updated }, { created_id: null }) }
  const created = await service.createMarketingSegments({ ...data, is_system: false })
  return new StepResponse<{ segment: any }, { created_id: string | null }>({ segment: created }, { created_id: created.id })
}, async (data, { container }) => { if (data?.created_id) await (container.resolve(MARKETING_MODULE) as MarketingModuleService).deleteMarketingSegments(data.created_id) })
