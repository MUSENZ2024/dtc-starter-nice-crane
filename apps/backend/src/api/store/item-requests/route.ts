import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { createItemRequestWorkflow } from "../../../workflows/create-item-request"

export const PostStoreItemRequestSchema = z.object({
  item_name: z.string().trim().min(2).max(140),
  item_type: z.enum(["bag", "watch", "wallet", "accessory", "other"]),
  details: z.string().trim().max(1000).optional(),
  requester_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
})

export async function POST(
  req: MedusaRequest<z.infer<typeof PostStoreItemRequestSchema>>,
  res: MedusaResponse
) {
  const image = req.file
  if (!image) {
    return res.status(400).json({ message: "Add a JPG, PNG or WebP image." })
  }
  const { result } = await createItemRequestWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      image: {
        filename: image.originalname,
        mime_type: image.mimetype,
        content: image.buffer.toString("base64"),
      },
    },
  })
  res.status(201).json({ request: { id: result.request.id, status: result.request.status } })
}
