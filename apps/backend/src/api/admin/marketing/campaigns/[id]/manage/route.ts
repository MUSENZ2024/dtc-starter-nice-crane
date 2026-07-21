import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { manageMarketingCampaignWorkflow } from "../../../../../../workflows/marketing/manage-marketing-campaign"
import type { ManageCampaignBody } from "../../validators"
export async function POST(req: AuthenticatedMedusaRequest<ManageCampaignBody>, res: MedusaResponse) { const { result } = await manageMarketingCampaignWorkflow(req.scope).run({ input: { campaign_id: req.params.id, action: req.validatedBody.action } }); res.json(result) }
