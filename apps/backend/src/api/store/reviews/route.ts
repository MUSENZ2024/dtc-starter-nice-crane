import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { createReviewWorkflow } from "../../../workflows/create-review"

export const PostStoreReviewSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  content: z.string().trim().min(20).max(1500),
  rating: z.coerce.number().int().min(1).max(5),
  reviewer_name: z.string().trim().min(2).max(80),
  reviewer_email: z.string().email().optional(),
  product_id: z.string().optional(),
})

export async function POST(
  req: MedusaRequest<z.infer<typeof PostStoreReviewSchema>>,
  res: MedusaResponse
) {
  const { result } = await createReviewWorkflow(req.scope).run({
    input: { ...req.validatedBody, source: "customer", status: "pending" },
  })
  res.status(201).json(result)
}
