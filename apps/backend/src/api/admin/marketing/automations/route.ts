import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createDefaultWelcomeFlowWorkflow } from "../../../../workflows/marketing/create-default-welcome-flow"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: flows } = await query.graph({ entity: "marketing_flows", fields: ["*", "steps.*", "enrollments.*", "enrollments.email_events.*"], pagination: { order: { created_at: "DESC" } } })
  res.status(200).json({ flows })
}
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { result } = await createDefaultWelcomeFlowWorkflow(req.scope).run()
  res.status(result.created ? 201 : 200).json(result)
}
