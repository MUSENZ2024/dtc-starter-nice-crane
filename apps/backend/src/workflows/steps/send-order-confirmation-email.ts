import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  createOrderConfirmationEmail,
  ORDER_EMAIL_FIELDS,
  type OrderEmailRecord,
} from "../../lib/order-confirmation-email"
import { getOrderConfirmationTemplate } from "../../modules/email-automation/defaults"
import { EMAIL_AUTOMATION_MODULE } from "../../modules/email-automation"
import type EmailAutomationModuleService from "../../modules/email-automation/service"

export type SendOrderConfirmationEmailInput = {
  order_id: string
  note?: string
  automated?: boolean
}

export const sendOrderConfirmationEmailStep = createStep(
  "send-order-confirmation-email",
  async (input: SendOrderConfirmationEmailInput, { container }) => {
    const query = container.resolve("query")
    const notificationModule = container.resolve("notification")
    const emailAutomation: EmailAutomationModuleService = container.resolve(
      EMAIL_AUTOMATION_MODULE
    )

    const template = await getOrderConfirmationTemplate(emailAutomation)

    if (input.automated && !template.enabled) {
      return new StepResponse({ skipped: true })
    }

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [...ORDER_EMAIL_FIELDS],
      filters: { id: input.order_id },
    })

    const order = orders[0] as unknown as OrderEmailRecord | undefined

    if (!order) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order ${input.order_id} was not found.`
      )
    }

    if (!order.email) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Order ${order.id} has no customer email address.`
      )
    }

    const email = await createOrderConfirmationEmail(order, template, input.note)

    await notificationModule.createNotifications({
      to: email.recipient,
      from: process.env.MUSE_EMAIL_FROM || "orders@musenz.com",
      channel: "email",
      content: {
        html: email.html,
        subject: email.subject,
      },
    })

    return new StepResponse({
      recipient: email.recipient,
      subject: email.subject,
      skipped: false,
    })
  }
)
