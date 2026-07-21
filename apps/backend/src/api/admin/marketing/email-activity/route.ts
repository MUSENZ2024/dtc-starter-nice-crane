import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_MODULE } from "../../../../modules/marketing"
import MarketingModuleService from "../../../../modules/marketing/service"
import { boundedInt, safeEmailEvent } from "../../../../lib/marketing-admin"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const service: MarketingModuleService = req.scope.resolve(MARKETING_MODULE)
  const limit = boundedInt(req.query.limit, 25, 100), offset = boundedInt(req.query.offset, 0, 100_000)
  const filters: Record<string, unknown> = {}
  if (typeof req.query.status === "string" && req.query.status) filters.status = req.query.status
  if (typeof req.query.template_key === "string" && req.query.template_key) filters.template_key = req.query.template_key
  if (typeof req.query.q === "string" && req.query.q.trim()) {
    const term = req.query.q.trim()
    if (term.includes("@")) {
      const subscribers = await service.listMarketingSubscribers({ email_normalized: { $like: `%${term.toLowerCase()}%` } }, { take: 100 })
      if (!subscribers.length) return res.status(200).json({ events: [], count: 0, limit, offset })
      filters.subscriber_id = subscribers.map((item) => item.id)
    } else filters.subject_snapshot = { $like: `%${term}%` }
  }
  const [events, count] = await service.listAndCountMarketingEmailEvents(filters, { take: limit, skip: offset, order: { scheduled_at: "DESC" }, relations: ["subscriber", "flow_step"] })
  res.status(200).json({ events: events.map(safeEmailEvent), count, limit, offset })
}
