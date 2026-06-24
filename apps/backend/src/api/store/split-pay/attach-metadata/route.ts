import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { attachSplitPayMetadataWorkflow } from "../../../../workflows/attach-split-pay-metadata"

/**
 * Not customer-facing — called once, server-side, by the storefront's
 * split-pay completion route (apps/storefront/.../api/split-pay/complete/route.ts)
 * immediately after it places the Medusa order for a split-pay checkout.
 * Stamps the order with the metadata the order-placed subscriber needs to
 * send the MUSE Pay confirmation email instead of the normal one.
 */
export const PostStoreSplitPayAttachMetadataSchema = z.object({
  order_id: z.string().min(1),
  schedule_id: z.string().min(1),
  subscription_id: z.string().min(1),
  total_cents: z.coerce.number().int().positive(),
  base_cents: z.coerce.number().int().positive(),
  final_cents: z.coerce.number().int().positive(),
  currency: z.string().min(1),
})

export async function POST(
  req: MedusaRequest<z.infer<typeof PostStoreSplitPayAttachMetadataSchema>>,
  res: MedusaResponse
) {
  const { result } = await attachSplitPayMetadataWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  res.status(200).json(result)
}
