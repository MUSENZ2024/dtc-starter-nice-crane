import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
import { isHistoricalWelcomeOrder } from "../../../lib/marketing-welcome-purchase"

export const manageMarketingEmailEventStep = createStep("manage-marketing-email-event", async ({ id, action, confirmation }: { id: string; action: "retry" | "resend" | "cancel"; confirmation: string }, { container }) => {
  const expected = action === "retry" ? "RETRY EMAIL" : action === "resend" ? "RESEND EMAIL" : "CANCEL EMAIL"
  if (confirmation !== expected) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Type ${expected} to confirm.`)
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const event = await service.retrieveMarketingEmailEvent(id, { relations: ["subscriber", "enrollment"] })
  if (action === "retry") {
    if (!['failed', 'cancelled'].includes(event.status) || event.attempt_count >= 3 || event.subscriber.status !== "subscribed") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This email event is not eligible for retry.")
    if (
      event.last_error === "purchased" &&
      event.enrollment?.status === "converted" &&
      event.enrollment.converted_order_id
    ) {
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      const { data: convertedOrders } = await query.graph({
        entity: "orders",
        fields: ["id", "created_at"],
        filters: { id: event.enrollment.converted_order_id },
        pagination: { take: 1 },
      })
      const convertedOrder = convertedOrders[0]
      if (
        convertedOrder?.created_at &&
        isHistoricalWelcomeOrder(
          new Date(convertedOrder.created_at),
          event.enrollment.entered_at,
        )
      ) {
        await service.updateMarketingEnrollments({
          id: event.enrollment.id,
          status: "active",
          cancelled_at: null,
          cancel_reason: null,
          converted_order_id: null,
          converted_at: null,
        })
      }
    }
    const updated = await service.updateMarketingEmailEvents({ id, status: "scheduled", scheduled_at: new Date(), failed_at: null, cancelled_at: null, last_error: null })
    return new StepResponse({ event: updated })
  }
  if (action === "resend") {
    if (!['sent', 'delivered', 'opened', 'clicked'].includes(event.status) || event.attempt_count >= 3 || event.subscriber.status !== "subscribed") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This email event is not eligible for resend.")
    const updated = await service.updateMarketingEmailEvents({ id, status: "scheduled", scheduled_at: new Date(), send_started_at: null, sent_at: null, delivered_at: null, first_opened_at: null, first_clicked_at: null, provider_notification_id: null, last_error: null })
    return new StepResponse({ event: updated })
  }
  if (!['scheduled', 'failed'].includes(event.status)) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Only scheduled or failed events can be cancelled.")
  const updated = await service.updateMarketingEmailEvents({ id, status: "cancelled", cancelled_at: new Date(), last_error: "cancelled_by_admin" })
  return new StepResponse({ event: updated })
})
