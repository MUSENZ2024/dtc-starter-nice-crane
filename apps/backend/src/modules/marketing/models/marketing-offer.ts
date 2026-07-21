import { model } from "@medusajs/framework/utils"
import { MARKETING_OFFER_AMOUNT_TYPES, MARKETING_OFFER_STATUSES } from "../types"
import MarketingOfferIssuance from "./marketing-offer-issuance"

const MarketingOffer = model
  .define("marketing_offer", {
    id: model.id().primaryKey(),
    key: model.text(),
    name: model.text(),
    status: model.enum([...MARKETING_OFFER_STATUSES]).default("draft"),
    amount_type: model.enum([...MARKETING_OFFER_AMOUNT_TYPES]).default("fixed"),
    amount: model.bigNumber(),
    currency_code: model.text().default("nzd"),
    minimum_spend: model.bigNumber(),
    expires_after_hours: model.number(),
    first_order_only: model.boolean().default(true),
    combinable: model.boolean().default(false),
    excluded_product_ids: model.json().nullable(),
    excluded_category_ids: model.json().nullable(),
    excluded_tag_ids: model.json().nullable(),
    metadata: model.json().nullable(),
    issuances: model.hasMany(() => MarketingOfferIssuance, { mappedBy: "offer" }),
  })
  .indexes([{ on: ["key"], unique: true }, { on: ["status"] }])

export default MarketingOffer
