import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { scheduleMarketingCampaignWorkflow } from "../../../../../../workflows/marketing/schedule-marketing-campaign"
import type { ScheduleCampaignBody } from "../../validators"
export async function POST(req: AuthenticatedMedusaRequest<ScheduleCampaignBody>, res: MedusaResponse) { const { result } = await scheduleMarketingCampaignWorkflow(req.scope).run({ input: { campaign_id: req.params.id, ...req.validatedBody } }); res.json(result) }
