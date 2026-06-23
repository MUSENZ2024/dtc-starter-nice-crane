import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { updateReviewStatusWorkflow } from "../../../../../workflows/update-review-status"

export const PostAdminReviewStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
})

export async function POST(
  req: MedusaRequest<z.infer<typeof PostAdminReviewStatusSchema>>,
  res: MedusaResponse
) {
  const { result } = await updateReviewStatusWorkflow(req.scope).run({
    input: { id: req.params.id, status: req.validatedBody.status },
  })
  res.json(result)
}
