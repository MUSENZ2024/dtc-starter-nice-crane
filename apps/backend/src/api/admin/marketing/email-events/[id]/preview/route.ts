import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_MODULE } from "../../../../../../modules/marketing"
import MarketingModuleService from "../../../../../../modules/marketing/service"
import { renderMarketingWelcomeEmail } from "../../../../../../lib/marketing-welcome-email"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const service: MarketingModuleService = req.scope.resolve(MARKETING_MODULE)
  const event = await service.retrieveMarketingEmailEvent(req.params.id, { relations: ["subscriber"] })
  const snapshot = (event.content_snapshot || {}) as Record<string, unknown>
  const storefront = process.env.STOREFRONT_URL || "https://musenz.com"
  const html = await renderMarketingWelcomeEmail({ templateKey: event.template_key, previewText: event.preview_text_snapshot, firstName: event.subscriber.first_name, code: String(snapshot.code || "MUSE20-PREVIEW"), expiresAt: new Date(String(snapshot.expires_at || Date.now())).toLocaleString("en-NZ", { timeZone: "Pacific/Auckland", dateStyle: "medium", timeStyle: "short" }), preference: String(snapshot.preference || "everything"), unsubscribeUrl: `${storefront}/marketing/unsubscribe?preview=1`, shopUrl: `${storefront}/store?preview=1` })
  res.setHeader("Content-Type", "text/html; charset=utf-8")
  res.setHeader("Cache-Control", "no-store")
  res.status(200).send(html)
}
