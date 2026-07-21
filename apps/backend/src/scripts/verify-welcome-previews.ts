import type { ExecArgs } from "@medusajs/framework/types"
import { MARKETING_MODULE } from "../modules/marketing"
import MarketingModuleService from "../modules/marketing/service"
import { renderMarketingWelcomeEmail } from "../lib/marketing-welcome-email"

export default async function verifyWelcomePreviews({ container }: ExecArgs) {
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const events = await service.listMarketingEmailEvents({}, { take: 5, order: { created_at: "DESC" }, relations: ["subscriber"] })
  if (!events.length) throw new Error("No marketing email events available for preview verification")
  for (const event of events) {
    const snapshot = (event.content_snapshot || {}) as Record<string, unknown>
    const html = await renderMarketingWelcomeEmail({ templateKey: event.template_key, previewText: event.preview_text_snapshot, firstName: event.subscriber.first_name, code: String(snapshot.code), expiresAt: new Date(String(snapshot.expires_at)).toLocaleString("en-NZ", { timeZone: "Pacific/Auckland" }), preference: String(snapshot.preference), unsubscribeUrl: "http://localhost:8000/marketing/unsubscribe?preview=1", shopUrl: "http://localhost:8000/store?preview=1" })
    if (!html.includes(String(snapshot.code)) || !html.includes("Unsubscribe")) throw new Error(`Preview validation failed for ${event.template_key}`)
    console.log(`${event.template_key}: preview rendered (${html.length} characters), no send invoked`)
  }
}
