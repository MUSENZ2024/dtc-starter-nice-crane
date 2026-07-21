import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_MODULE } from "../../../../modules/marketing"
import MarketingModuleService from "../../../../modules/marketing/service"
import { updateMarketingControlWorkflow } from "../../../../workflows/marketing/update-marketing-control"
import type { UpdateMarketingControlBody } from "../campaigns/validators"
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) { const service: MarketingModuleService = req.scope.resolve(MARKETING_MODULE); const [control] = await service.listMarketingControls({ key: "global" }, { take: 1 }); res.json({ control: control || { key: "global", global_pause: false, monthly_safety_limit: 9000, daily_dispatch_cap: 1350, frequency_days: 3 } }) }
export async function POST(req: AuthenticatedMedusaRequest<UpdateMarketingControlBody>, res: MedusaResponse) { const { result } = await updateMarketingControlWorkflow(req.scope).run({ input: { global_pause: req.validatedBody.global_pause, updated_by: req.auth_context?.actor_id || null } }); res.json({ control: result }) }
