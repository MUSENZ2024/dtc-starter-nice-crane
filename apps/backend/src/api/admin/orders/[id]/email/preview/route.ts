import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  createOrderConfirmationEmail,
  getOrderEmailRecipient,
  ORDER_EMAIL_FIELDS,
  type OrderEmailRecord,
} from "../../../../../../lib/order-confirmation-email"
import { getOrderConfirmationTemplate } from "../../../../../../modules/email-automation/defaults"
import { EMAIL_AUTOMATION_MODULE } from "../../../../../../modules/email-automation"
import type EmailAutomationModuleService from "../../../../../../modules/email-automation/service"
import type { OrderEmailInput } from "../validators"

export async function POST(
  req: MedusaRequest<OrderEmailInput>,
  res: MedusaResponse
) {
  const query = req.scope.resolve("query")
  const emailAutomation: EmailAutomationModuleService = req.scope.resolve(
    EMAIL_AUTOMATION_MODULE
  )
  const template = await getOrderConfirmationTemplate(emailAutomation)
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [...ORDER_EMAIL_FIELDS],
    filters: { id: req.params.id },
  })

  const order = orders[0] as unknown as OrderEmailRecord | undefined

  if (!order) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order ${req.params.id} was not found.`
    )
  }

  if (!getOrderEmailRecipient(order)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Order ${order.id} has no customer email address.`
    )
  }

  const email = await createOrderConfirmationEmail(
    order,
    template,
    req.validatedBody.note
  )
  res.json(email)
}
