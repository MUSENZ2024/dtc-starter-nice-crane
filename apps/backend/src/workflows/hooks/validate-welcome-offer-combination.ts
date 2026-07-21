import { updateCartPromotionsWorkflow } from "@medusajs/medusa/core-flows"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETING_MODULE } from "../../modules/marketing"
import MarketingModuleService from "../../modules/marketing/service"

updateCartPromotionsWorkflow.hooks.validate(
  async ({ input, cart }, { container }) => {
    const incoming = input.promo_codes || []
    if (!incoming.length) return

    const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
    const incomingIssuances = await service.listMarketingOfferIssuances({ code: incoming })
    const appliedCodes = (cart.promotions || []).map((promotion: { code?: string }) => promotion.code).filter(Boolean) as string[]
    const appliedIssuances = appliedCodes.length
      ? await service.listMarketingOfferIssuances({ code: appliedCodes })
      : []

    const addsWelcomeCode = incomingIssuances.length > 0
    const hasWelcomeCode = appliedIssuances.length > 0
    const addsOtherCode = incoming.some((code) => !incomingIssuances.some((issuance) => issuance.code === code))
    const hasOtherCode = appliedCodes.some((code) => !appliedIssuances.some((issuance) => issuance.code === code))

    if ((addsWelcomeCode && (hasOtherCode || addsOtherCode)) || (hasWelcomeCode && addsOtherCode)) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "The MUSE welcome offer cannot be combined with another promotion.")
    }
  },
)
