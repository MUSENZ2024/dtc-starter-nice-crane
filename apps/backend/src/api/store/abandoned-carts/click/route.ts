import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { trackAbandonedCartClickWorkflow } from "../../../../workflows/track-abandoned-cart-click";

export const PostStoreAbandonedCartClickSchema = z.object({
  cart_id: z.string().min(1),
  tracking_token: z.string().uuid(),
});

export type PostStoreAbandonedCartClick = z.infer<
  typeof PostStoreAbandonedCartClickSchema
>;

export async function POST(
  req: MedusaRequest<PostStoreAbandonedCartClick>,
  res: MedusaResponse,
) {
  const { result } = await trackAbandonedCartClickWorkflow(req.scope).run({
    input: req.validatedBody,
  });
  res.json(result);
}
