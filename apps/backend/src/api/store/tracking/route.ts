import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { lookupTrackingWorkflow } from "../../../workflows/lookup-tracking";
import type { PostStoreTrackingLookup } from "./validators";

export async function POST(
  req: MedusaRequest<PostStoreTrackingLookup>,
  res: MedusaResponse,
) {
  const { result } = await lookupTrackingWorkflow(req.scope).run({
    input: { tracking_number: req.validatedBody.tracking_number },
  });
  res.json(result);
}
