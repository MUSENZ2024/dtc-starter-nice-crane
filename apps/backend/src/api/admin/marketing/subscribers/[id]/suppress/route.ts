import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { suppressMarketingSubscriberWorkflow } from "../../../../../../workflows/marketing/suppress-marketing-subscriber"
export async function POST(req: AuthenticatedMedusaRequest<{ reason: string; confirmation: string }>, res: MedusaResponse) {
  const { result } = await suppressMarketingSubscriberWorkflow(req.scope).run({ input: { id: req.params.id, reason: req.body.reason, confirmation: req.body.confirmation } })
  res.status(200).json(result)
}
