import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from "@medusajs/framework/http"
import { attachTrackingToShippedFulfillmentWorkflow } from "../../../../../../../workflows/attach-tracking-to-shipped-fulfillment"
import type { PostAdminAttachTrackingSchema } from "../../../../tracking-validators"

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminAttachTrackingSchema>,
  res: MedusaResponse
) {
  const { result } = await attachTrackingToShippedFulfillmentWorkflow(
    req.scope
  ).run({
    input: {
      order_id: req.params.id,
      fulfillment_id: req.params.fulfillment_id,
      tracking_number: req.validatedBody.tracking_number,
      tracking_url: req.validatedBody.tracking_url,
      send_notification: req.validatedBody.send_notification
    }
  })

  res.status(200).json({ fulfillment: result })
}
