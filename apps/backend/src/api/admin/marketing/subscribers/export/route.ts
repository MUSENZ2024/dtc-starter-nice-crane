import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_MODULE } from "../../../../../modules/marketing"
import MarketingModuleService from "../../../../../modules/marketing/service"
import { csvCell, subscriberFilters } from "../../../../../lib/marketing-admin"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const service: MarketingModuleService = req.scope.resolve(MARKETING_MODULE)
  const subscribers = await service.listMarketingSubscribers(subscriberFilters(req.query), { take: 10_000, order: { subscribed_at: "DESC" } })
  const header = ["email", "status", "preference", "customer_type", "source_first", "source_latest", "subscribed_at", "order_count", "lifetime_revenue", "currency"]
  const rows = subscribers.map((item) => [item.email, item.status, item.primary_preference, item.customer_type, item.source_first, item.source_latest, item.subscribed_at.toISOString(), item.order_count, item.lifetime_revenue, "NZD"].map(csvCell).join(","))
  res.setHeader("Content-Type", "text/csv; charset=utf-8")
  res.setHeader("Content-Disposition", `attachment; filename="muse-marketing-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`)
  res.setHeader("Cache-Control", "no-store")
  res.status(200).send([header.join(","), ...rows].join("\n"))
}
