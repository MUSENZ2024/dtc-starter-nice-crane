import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
import { validateCampaignContent } from "../../../lib/marketing-campaign-email"

export type SaveCampaignInput = { id?: string; name: string; subject: string; preview_text: string; content: unknown[]; audience_definition: Record<string, unknown>; utm_campaign: string; created_by?: string | null }
export const saveMarketingCampaignStep = createStep("save-marketing-campaign", async (input: SaveCampaignInput, { container }) => {
  if (!input.name.trim() || !input.subject.trim() || !input.preview_text.trim()) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Name, subject and preview text are required.")
  const errors = validateCampaignContent(input.content)
  if (errors.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, errors.join(" "))
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  if (input.id) {
    const current = await service.retrieveMarketingCampaign(input.id)
    if (current.status !== "draft" && current.status !== "paused") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Only draft or paused campaigns can be edited.")
    const updated = await service.updateMarketingCampaigns({ id: input.id, name: input.name, subject: input.subject, preview_text: input.preview_text, content: { blocks: input.content }, audience_definition: input.audience_definition, utm_campaign: input.utm_campaign })
    return new StepResponse<{ campaign: any }, { created_id: string | null }>({ campaign: Array.isArray(updated) ? updated[0] : updated }, { created_id: null })
  }
  const created = await service.createMarketingCampaigns({ ...input, content: { blocks: input.content }, status: "draft", audience_snapshot_count: 0, excluded_snapshot_count: 0, sender: process.env.MUSE_EMAIL_FROM || "MUSE NZ <hello@musenz.com>", template_key: "structured_campaign_v1" })
  return new StepResponse<{ campaign: any }, { created_id: string | null }>({ campaign: created }, { created_id: created.id })
}, async (data, { container }) => { if (data?.created_id) await (container.resolve(MARKETING_MODULE) as MarketingModuleService).deleteMarketingCampaigns(data.created_id) })
