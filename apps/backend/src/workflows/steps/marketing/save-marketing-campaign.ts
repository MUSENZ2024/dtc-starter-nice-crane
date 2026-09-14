import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
import { validateCampaignContent } from "../../../lib/marketing-campaign-email"

export type SaveCampaignInput = { id?: string; name: string; subject: string; preview_text?: string; template_key?: "structured_campaign_v1" | "spring_rotation_launch_v1" | "raw_html_v1"; content: unknown[]; audience_definition: Record<string, unknown>; utm_campaign?: string; created_by?: string | null }
export const saveMarketingCampaignStep = createStep("save-marketing-campaign", async (input: SaveCampaignInput, { container }) => {
  if (!input.name.trim() || !input.subject.trim()) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Campaign name and subject are required.")
  const previewText = input.preview_text?.trim() || ""
  const nameSlug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80)
  const utmCampaign = input.utm_campaign?.trim() || (nameSlug.length >= 3 ? nameSlug : `campaign-${nameSlug || "email"}`)
  const errors = validateCampaignContent(input.content)
  if (errors.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, errors.join(" "))
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  if (input.id) {
    const current = await service.retrieveMarketingCampaign(input.id)
    if (current.status !== "draft" && current.status !== "paused") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Only draft or paused campaigns can be edited.")
    const updated = await service.updateMarketingCampaigns({ id: input.id, name: input.name, subject: input.subject, preview_text: previewText, template_key: input.template_key || "structured_campaign_v1", content: { blocks: input.content }, audience_definition: input.audience_definition, utm_campaign: utmCampaign })
    return new StepResponse<{ campaign: any }, { created_id: string | null }>({ campaign: Array.isArray(updated) ? updated[0] : updated }, { created_id: null })
  }
  const created = await service.createMarketingCampaigns({ ...input, preview_text: previewText, utm_campaign: utmCampaign, content: { blocks: input.content }, status: "draft", audience_snapshot_count: 0, excluded_snapshot_count: 0, sender: process.env.MUSE_EMAIL_FROM || "MUSE NZ <orders@musenz.com>", template_key: input.template_key || "structured_campaign_v1" })
  return new StepResponse<{ campaign: any }, { created_id: string | null }>({ campaign: created }, { created_id: created.id })
}, async (data, { container }) => { if (data?.created_id) await (container.resolve(MARKETING_MODULE) as MarketingModuleService).deleteMarketingCampaigns(data.created_id) })
