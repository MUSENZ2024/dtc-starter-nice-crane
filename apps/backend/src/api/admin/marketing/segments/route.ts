import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_MODULE } from "../../../../modules/marketing"
import MarketingModuleService from "../../../../modules/marketing/service"
import { saveMarketingSegmentWorkflow } from "../../../../workflows/marketing/save-marketing-segment"
import type { SaveSegmentBody } from "./validators"
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) { const service: MarketingModuleService = req.scope.resolve(MARKETING_MODULE); const segments = await service.listMarketingSegments({}, { take: 1000, order: { name: "ASC" } }); res.json({ segments }) }
export async function POST(req: AuthenticatedMedusaRequest<SaveSegmentBody>, res: MedusaResponse) { const { result } = await saveMarketingSegmentWorkflow(req.scope).run({ input: req.validatedBody }); res.status(201).json(result) }
