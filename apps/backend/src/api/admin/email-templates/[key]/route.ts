import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updateEmailTemplateWorkflow } from "../../../../workflows/update-email-template"
import type { UpdateEmailTemplateInput } from "../validators"

export async function POST(
  req: MedusaRequest<UpdateEmailTemplateInput>,
  res: MedusaResponse
) {
  const { result } = await updateEmailTemplateWorkflow(req.scope).run({
    input: {
      key: req.params.key,
      ...req.validatedBody,
    },
  })

  res.json({ template: result })
}
