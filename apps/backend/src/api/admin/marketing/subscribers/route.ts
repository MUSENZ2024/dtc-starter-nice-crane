import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_MODULE } from "../../../../modules/marketing"
import MarketingModuleService from "../../../../modules/marketing/service"
import { boundedInt, subscriberFilters } from "../../../../lib/marketing-admin"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const service: MarketingModuleService = req.scope.resolve(MARKETING_MODULE)
  const limit = boundedInt(req.query.limit, 20, 100)
  const offset = boundedInt(req.query.offset, 0, 100_000)
  const filters = subscriberFilters(req.query)
  const [subscribers, count] = await service.listAndCountMarketingSubscribers(
    filters,
    { take: limit, skip: offset, order: { subscribed_at: "DESC" } },
  )
  res.status(200).json({ subscribers, count, limit, offset })
}
