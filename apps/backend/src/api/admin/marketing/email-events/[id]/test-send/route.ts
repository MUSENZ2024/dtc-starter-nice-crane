import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { sendMarketingTestEmailWorkflow } from "../../../../../../workflows/marketing/send-marketing-test-email"
export async function POST(req: AuthenticatedMedusaRequest<{ to: string; confirmation: string }>, res: MedusaResponse) {
  const { result } = await sendMarketingTestEmailWorkflow(req.scope).run({ input: { event_id: req.params.id, to: req.body.to, confirmation: req.body.confirmation } })
  res.status(200).json(result)
}
