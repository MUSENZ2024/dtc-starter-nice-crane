import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { sendOrderConfirmationEmailWorkflow } from "../../../../../../workflows/send-order-confirmation-email"
import type { OrderEmailInput } from "../validators"

export async function POST(
  req: MedusaRequest<OrderEmailInput>,
  res: MedusaResponse
) {
  const { result } = await sendOrderConfirmationEmailWorkflow(req.scope).run({
    input: {
      order_id: req.params.id,
      note: req.validatedBody.note,
    },
  })

  res.json(result)
}
