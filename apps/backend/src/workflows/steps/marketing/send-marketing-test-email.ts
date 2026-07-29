import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
import { renderMarketingWelcomeEmail } from "../../../lib/marketing-welcome-email"

export const sendMarketingTestEmailStep = createStep("send-marketing-test-email", async ({ event_id, to, confirmation }: { event_id: string; to: string; confirmation: string }, { container }) => {
  if (confirmation !== "SEND TEST") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Type SEND TEST to confirm this test email.")
  if (!/^\S+@\S+\.\S+$/.test(to)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "A valid test recipient is required.")
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const event = await service.retrieveMarketingEmailEvent(event_id, { relations: ["subscriber"] })
  const snapshot = (event.content_snapshot || {}) as Record<string, unknown>
  const storefront = process.env.STOREFRONT_URL || "https://musenz.com"
  const html = await renderMarketingWelcomeEmail({ templateKey: event.template_key, previewText: `[TEST] ${event.preview_text_snapshot}`, firstName: "MUSE test", code: String(snapshot.code || "MUSE20-PREVIEW"), expiresAt: new Date(String(snapshot.expires_at || Date.now())).toLocaleString("en-NZ", { timeZone: "Pacific/Auckland", dateStyle: "medium", timeStyle: "short" }), preference: String(snapshot.preference || "everything"), unsubscribeUrl: `${storefront}/marketing/unsubscribe?preview=1`, shopUrl: `${storefront}/store?preview=1` })
  const notifications = await container.resolve(Modules.NOTIFICATION).createNotifications({ to, from: process.env.MUSE_EMAIL_FROM || "MUSE NZ <orders@musenz.com>", channel: "email", content: { subject: `[TEST] ${event.subject_snapshot}`, html } })
  const notification = Array.isArray(notifications) ? notifications[0] : notifications
  return new StepResponse({ sent: true, notification_id: notification?.id || null, recipient: to })
})
