import { createPromotionsWorkflow, deletePromotionsWorkflow } from "@medusajs/medusa/core-flows"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
import { generateWelcomeOfferCode, offerExpiry, WELCOME_OFFER_KEY } from "../../../modules/marketing/offers"

export type IssueWelcomeOfferInput = { subscriber_id: string }
type Compensation = { issuance_id?: string; promotion_id?: string }
type IssueResult = {
  status: "offer_inactive" | "already_issued" | "issued"
  issuance?: Record<string, unknown>
}

const idsFromJson = (value: unknown): string[] => {
  if (!value || typeof value !== "object" || !("ids" in value)) return []
  const ids = (value as { ids?: unknown }).ids
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : []
}

export const issueWelcomeOfferStep = createStep(
  "issue-welcome-offer",
  async ({ subscriber_id }: IssueWelcomeOfferInput, { container }) => {
    const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
    const [offer] = await service.listMarketingOffers({ key: WELCOME_OFFER_KEY, status: "active" }, { take: 1 })
    if (!offer) return new StepResponse<IssueResult, Compensation>({ status: "offer_inactive" }, {})

    const [existing] = await service.listMarketingOfferIssuances(
      { offer_id: offer.id, subscriber_id },
      { take: 1 },
    )
    if (existing) return new StepResponse<IssueResult, Compensation>({ status: "already_issued", issuance: existing as unknown as Record<string, unknown> }, {})

    const subscriber = await service.retrieveMarketingSubscriber(subscriber_id)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: priorOrders } = await query.graph({
      entity: "orders",
      fields: ["id"],
      filters: { email: subscriber.email_normalized },
      pagination: { take: 1 },
    })
    const isExistingCustomer = priorOrders.length > 0

    const issuedAt = new Date()
    const expiresAt = offerExpiry(issuedAt, offer.expires_after_hours)
    const code = generateWelcomeOfferCode()
    const rules: Array<{ attribute: string; operator: "eq" | "gte"; values: string[] }> = [
      { attribute: "item_subtotal", operator: "gte", values: [String(offer.minimum_spend)] },
    ]
    if (subscriber.customer_id) rules.push({ attribute: "customer_id", operator: "eq", values: [subscriber.customer_id] })

    const { result: promotions } = await createPromotionsWorkflow(container).run({
      input: {
        promotionsData: [{
          code,
          type: "standard",
          status: "active",
          is_automatic: false,
          limit: 1,
          application_method: {
            type: offer.amount_type,
            target_type: "items",
            allocation: "across",
            value: Number(offer.amount),
            currency_code: offer.currency_code,
            target_rules: [
              ...(idsFromJson(offer.excluded_product_ids).length ? [{ attribute: "product.id", operator: "ne" as const, values: idsFromJson(offer.excluded_product_ids) }] : []),
              ...(idsFromJson(offer.excluded_category_ids).length ? [{ attribute: "product.categories.id", operator: "ne" as const, values: idsFromJson(offer.excluded_category_ids) }] : []),
              ...(idsFromJson(offer.excluded_tag_ids).length ? [{ attribute: "product.tags.id", operator: "ne" as const, values: idsFromJson(offer.excluded_tag_ids) }] : []),
            ],
          },
          rules,
          campaign: {
            name: `${offer.key}:${code}`,
            campaign_identifier: code,
            starts_at: issuedAt,
            ends_at: expiresAt,
          },
        }],
      },
    })
    const promotion = promotions[0]
    const issuance = await service.createMarketingOfferIssuances({
      offer_id: offer.id,
      subscriber_id,
      promotion_id: promotion.id,
      code,
      status: "active",
      issued_at: issuedAt,
      expires_at: expiresAt,
      currency_code: offer.currency_code,
    })
    await service.updateMarketingSubscribers({
      id: subscriber.id,
      customer_type: isExistingCustomer ? "returning" : "first_time",
      metadata: {
        ...((subscriber.metadata || {}) as Record<string, unknown>),
        welcome_offer_registered_at: issuedAt.toISOString(),
        welcome_offer_legacy_customer: isExistingCustomer,
        welcome_offer_issuance_id: issuance.id,
      },
    })
    return new StepResponse<IssueResult, Compensation>({ status: "issued", issuance: issuance as unknown as Record<string, unknown> }, { issuance_id: issuance.id, promotion_id: promotion.id })
  },
  async (data: Compensation | undefined, { container }) => {
    if (!data) return
    const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
    if (data.issuance_id) await service.deleteMarketingOfferIssuances(data.issuance_id)
    if (data.promotion_id) await deletePromotionsWorkflow(container).run({ input: { ids: [data.promotion_id] } })
  },
)
