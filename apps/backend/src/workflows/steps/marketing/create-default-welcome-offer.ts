import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
import { WELCOME_OFFER_DEFAULTS, WELCOME_OFFER_KEY } from "../../../modules/marketing/offers"

export const createDefaultWelcomeOfferStep = createStep(
  "create-default-welcome-offer",
  async (_, { container }) => {
    const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
    const [existing] = await service.listMarketingOffers({ key: WELCOME_OFFER_KEY }, { take: 1 })
    if (existing) return new StepResponse({ offer: existing, created: false }, {})
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: clearanceTags } = await query.graph({ entity: "product_tags", fields: ["id", "value"], filters: { value: "Clearance" } })
    const offer = await service.createMarketingOffers({ ...WELCOME_OFFER_DEFAULTS, excluded_tag_ids: { ids: clearanceTags.map((tag) => tag.id) } })
    return new StepResponse({ offer, created: true }, { offer_id: offer.id })
  },
  async (data: { offer_id?: string } | undefined, { container }) => {
    if (!data?.offer_id) return
    const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
    await service.deleteMarketingOffers(data.offer_id)
  },
)
