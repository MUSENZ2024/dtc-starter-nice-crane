import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
import type { MarketingOfferStatus } from "../../../modules/marketing/types"

export const updateMarketingOfferStatusStep = createStep(
  "update-marketing-offer-status",
  async ({ id, status }: { id: string; status: MarketingOfferStatus }, { container }) => {
    const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
    const previous = await service.retrieveMarketingOffer(id)
    const offer = await service.updateMarketingOffers({ id, status })
    return new StepResponse({ offer }, { id, status: previous.status })
  },
  async (data: { id: string; status: MarketingOfferStatus } | undefined, { container }) => {
    if (!data) return
    const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
    await service.updateMarketingOffers(data)
  },
)
