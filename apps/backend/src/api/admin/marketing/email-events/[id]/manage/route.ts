import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { manageMarketingEmailEventWorkflow } from "../../../../../../workflows/marketing/manage-marketing-email-event"
export async function POST(req: AuthenticatedMedusaRequest<{ action: "retry" | "resend" | "cancel"; confirmation: string }>, res: MedusaResponse) {
  const { result } = await manageMarketingEmailEventWorkflow(req.scope).run({ input: { id: req.params.id, action: req.body.action, confirmation: req.body.confirmation } })
  res.status(200).json(result)
}
