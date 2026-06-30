import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import {
  fetchAuthoritativeManualUpdateOrderTotals,
  ManualUpdateEmailOrder,
  MANUAL_ORDER_UPDATE_TEMPLATE_OPTIONS,
  ORDER_MANUAL_UPDATE_FIELDS,
  renderOrderManualUpdateEmail,
} from "../../../../../lib/order-manual-update-email"
import { MANUAL_ORDER_UPDATE_TEMPLATES, ManualOrderUpdateKey } from "../../../../../emails/OrderManualUpdateTemplate"

const ManualOrderUpdateKeys = Object.keys(MANUAL_ORDER_UPDATE_TEMPLATES) as [ManualOrderUpdateKey, ...ManualOrderUpdateKey[]]

export const PostAdminOrderEmailUpdateSchema = z.object({
  template_key: z.enum(ManualOrderUpdateKeys),
  note: z.string().trim().max(1200).optional(),
})

export type PostAdminOrderEmailUpdateSchema = z.infer<typeof PostAdminOrderEmailUpdateSchema>

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({ templates: MANUAL_ORDER_UPDATE_TEMPLATE_OPTIONS })
}

export async function POST(
  req: MedusaRequest<PostAdminOrderEmailUpdateSchema>,
  res: MedusaResponse
) {
  const query = req.scope.resolve("query")
  const notificationModule = req.scope.resolve("notification")
  const logger = req.scope.resolve("logger")
  const orderId = req.params.id
  const { template_key: templateKey, note } = req.validatedBody

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ORDER_MANUAL_UPDATE_FIELDS as unknown as string[],
    filters: {
      id: orderId,
    },
  })

  const rawOrder = orders[0] as ManualUpdateEmailOrder | undefined

  if (!rawOrder) {
    res.status(404).json({ message: "Order not found" })
    return
  }

  const order = await fetchAuthoritativeManualUpdateOrderTotals(req.scope, rawOrder)
  const html = await renderOrderManualUpdateEmail(order, templateKey, note)
  const template = MANUAL_ORDER_UPDATE_TEMPLATES[templateKey]

  if (!html || !order.email) {
    res.status(400).json({ message: "Order is missing an email address or renderable email data." })
    return
  }

  await notificationModule.createNotifications({
    to: order.email,
    from: process.env.MUSE_EMAIL_FROM || "orders@musenz.com",
    channel: "email",
    content: {
      html,
      subject: template.subject,
    },
  })

  logger.info(`Manual ${templateKey} email sent for order ${order.id} to ${order.email}.`)

  res.json({
    sent: true,
    to: order.email,
    subject: template.subject,
    template: {
      key: templateKey,
      label: template.label,
    },
  })
}
