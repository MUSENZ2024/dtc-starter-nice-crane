import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from "@medusajs/framework/http"
import { restoreFulfillmentShippingWorkflow } from "../../../../../../../workflows/restore-fulfillment-shipping"

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { result } = await restoreFulfillmentShippingWorkflow(req.scope).run({
    input: {
      order_id: req.params.id,
      fulfillment_id: req.params.fulfillment_id
    }
  })

  res.status(200).json({ fulfillment: result })
}
