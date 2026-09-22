import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { updateItemRequestWorkflow } from "../../../../workflows/update-item-request"

export const PostAdminItemRequestSchema = z.object({
  status: z.enum(["pending", "reviewing", "quoted", "closed"]),
  admin_note: z.string().trim().max(1000).optional(),
})

export async function POST(
  req: MedusaRequest<z.infer<typeof PostAdminItemRequestSchema>>,
  res: MedusaResponse
) {
  const { result } = await updateItemRequestWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })
  res.json(result)
}
