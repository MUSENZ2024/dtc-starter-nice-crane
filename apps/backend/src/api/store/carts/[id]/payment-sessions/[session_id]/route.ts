import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { deletePaymentSessionsWorkflow } from "@medusajs/medusa/core-flows"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const cartId = req.params.id
  const sessionId = req.params.session_id
  const query = req.scope.resolve("query")

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "payment_collection.id",
      "payment_collection.payment_sessions.id",
      "payment_collection.payment_sessions.status",
    ],
    filters: { id: cartId },
  })

  const cart = carts[0]
  const paymentSession = cart?.payment_collection?.payment_sessions?.find(
    (session) => session?.id === sessionId
  )

  if (!paymentSession) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Payment session was not found on this cart."
    )
  }

  if (paymentSession.status !== "pending") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Only a pending payment session can be refreshed."
    )
  }

  await deletePaymentSessionsWorkflow(req.scope).run({
    input: { ids: [sessionId] },
  })

  res.status(200).json({ id: sessionId, deleted: true })
}
