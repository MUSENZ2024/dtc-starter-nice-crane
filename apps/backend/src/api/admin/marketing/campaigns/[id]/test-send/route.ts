import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { testMarketingCampaignWorkflow } from "../../../../../../workflows/marketing/test-marketing-campaign"
import type { TestCampaignBody } from "../../validators"
export async function POST(req: AuthenticatedMedusaRequest<TestCampaignBody>, res: MedusaResponse) { const { result } = await testMarketingCampaignWorkflow(req.scope).run({ input: { campaign_id: req.params.id, ...req.validatedBody } }); res.json(result) }
