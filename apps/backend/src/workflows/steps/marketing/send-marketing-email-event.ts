import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
import { renderMarketingWelcomeEmail } from "../../../lib/marketing-welcome-email"

const boundedError = (error: unknown) => (error instanceof Error ? error.message : String(error)).slice(0, 500)

type SendResult = { sent: boolean; reason?: string; event_id?: string }
export const sendMarketingEmailEventStep = createStep("send-marketing-email-event", async ({ event_id }: { event_id: string }, { container }) => {
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const event = await service.retrieveMarketingEmailEvent(event_id, { relations: ["subscriber", "enrollment", "flow_step"] })
  if (event.status !== "scheduled" || event.scheduled_at > new Date()) return new StepResponse<SendResult, Record<string, never>>({ sent: false, reason: "not_due" }, {})
  const subscriber = event.subscriber
  const enrollment = event.enrollment
  const flow = enrollment ? await service.retrieveMarketingFlow(enrollment.flow_id) : null
  const snapshot = (event.content_snapshot || {}) as Record<string, unknown>
  const expiresAt = new Date(String(snapshot.expires_at || 0))
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orders } = await query.graph({ entity: "orders", fields: ["id"], filters: { email: subscriber.email_normalized }, pagination: { take: 1 } })
  const cancelReason = subscriber.status !== "subscribed" ? subscriber.status : !enrollment || enrollment.status !== "active" ? "enrollment_inactive" : !flow || flow.status !== "active" ? "flow_inactive" : orders.length ? "purchased" : expiresAt <= new Date() ? "offer_expired" : null
  if (cancelReason) {
    const now = new Date()
    await service.updateMarketingEmailEvents({ id: event.id, status: "cancelled", cancelled_at: now, last_error: cancelReason })
    if (enrollment && enrollment.status === "active") await service.updateMarketingEnrollments({ id: enrollment.id, status: orders.length ? "converted" : subscriber.status === "unsubscribed" ? "unsubscribed" : subscriber.status === "suppressed" ? "suppressed" : "cancelled", cancelled_at: now, cancel_reason: cancelReason, converted_order_id: orders[0]?.id || null, converted_at: orders.length ? now : null })
    return new StepResponse<SendResult, Record<string, never>>({ sent: false, reason: cancelReason }, {})
  }
  await service.updateMarketingEmailEvents({ id: event.id, status: "sending", send_started_at: new Date(), attempt_count: event.attempt_count + 1 })
  try {
    const storefront = process.env.STOREFRONT_URL || "http://localhost:8000"
    const html = await renderMarketingWelcomeEmail({ templateKey: event.template_key, previewText: event.preview_text_snapshot, firstName: subscriber.first_name, code: String(snapshot.code), expiresAt: expiresAt.toLocaleString("en-NZ", { timeZone: "Pacific/Auckland", dateStyle: "medium", timeStyle: "short" }), preference: String(snapshot.preference || "everything"), unsubscribeUrl: `${storefront}/marketing/unsubscribe?token=${encodeURIComponent(String(snapshot.unsubscribe_token))}`, shopUrl: `${storefront}/store?utm_source=muse_email&utm_medium=email&utm_campaign=welcome` })
    const notifications = await container.resolve(Modules.NOTIFICATION).createNotifications({ to: subscriber.email_normalized, from: process.env.MUSE_EMAIL_FROM || "orders@musenz.com", channel: "email", content: { subject: event.subject_snapshot, html } })
    const notification = Array.isArray(notifications) ? notifications[0] : notifications
    await service.updateMarketingEmailEvents({ id: event.id, status: "sent", sent_at: new Date(), provider_notification_id: notification?.id || null, last_error: null })
    return new StepResponse<SendResult, Record<string, never>>({ sent: true, event_id: event.id }, {})
  } catch (error) {
    await service.updateMarketingEmailEvents({ id: event.id, status: "failed", failed_at: new Date(), last_error: boundedError(error) })
    throw error
  }
})
