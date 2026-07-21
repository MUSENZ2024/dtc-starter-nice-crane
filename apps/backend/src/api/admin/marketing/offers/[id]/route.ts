import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updateMarketingOfferStatusWorkflow } from "../../../../../workflows/marketing/update-marketing-offer-status"
import type { MarketingOfferStatus } from "../../../../../modules/marketing/types"

export async function POST(req: AuthenticatedMedusaRequest<{ status: "draft" | "active" | "paused" | "archived" }>, res: MedusaResponse) {
  const status = req.body?.status
  if (!["draft", "active", "paused", "archived"].includes(status)) {
    return res.status(400).json({ message: "Invalid offer status." })
  }
  const { result } = await updateMarketingOfferStatusWorkflow(req.scope).run({ input: { id: req.params.id, status: status as MarketingOfferStatus } })
  res.status(200).json(result)
}
