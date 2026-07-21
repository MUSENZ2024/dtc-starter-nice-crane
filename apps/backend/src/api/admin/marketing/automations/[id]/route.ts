import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updateMarketingFlowStatusWorkflow } from "../../../../../workflows/marketing/update-marketing-flow-status"
export async function POST(req: AuthenticatedMedusaRequest<{ status: "draft" | "active" | "paused" | "archived" }>, res: MedusaResponse) {
  if (!["draft", "active", "paused", "archived"].includes(req.body.status)) return res.status(400).json({ message: "Invalid flow status." })
  const { result } = await updateMarketingFlowStatusWorkflow(req.scope).run({ input: { id: req.params.id, status: req.body.status } })
  res.status(200).json(result)
}
