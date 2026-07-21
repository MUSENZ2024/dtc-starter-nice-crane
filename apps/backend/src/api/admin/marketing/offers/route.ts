import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_MODULE } from "../../../../modules/marketing"
import MarketingModuleService from "../../../../modules/marketing/service"
import { createDefaultWelcomeOfferWorkflow } from "../../../../workflows/marketing/create-default-welcome-offer"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const service: MarketingModuleService = req.scope.resolve(MARKETING_MODULE)
  const [offers, count] = await service.listAndCountMarketingOffers({}, { order: { created_at: "DESC" } })
  const issuances = await service.listMarketingOfferIssuances({}, { order: { issued_at: "DESC" }, take: 100 })
  res.status(200).json({ offers, issuances, count })
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { result } = await createDefaultWelcomeOfferWorkflow(req.scope).run()
  res.status(result.created ? 201 : 200).json(result)
}
