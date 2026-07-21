import { model } from "@medusajs/framework/utils"
import { MARKETING_ISSUANCE_STATUSES } from "../types"
import MarketingOffer from "./marketing-offer"
import MarketingSubscriber from "./marketing-subscriber"

const MarketingOfferIssuance = model
  .define("marketing_offer_issuance", {
    id: model.id().primaryKey(),
    offer: model.belongsTo(() => MarketingOffer, { mappedBy: "issuances" }),
    subscriber: model.belongsTo(() => MarketingSubscriber, { mappedBy: "offer_issuances" }),
    promotion_id: model.text(),
    code: model.text(),
    status: model.enum([...MARKETING_ISSUANCE_STATUSES]).default("active"),
    issued_at: model.dateTime(),
    expires_at: model.dateTime(),
    redeemed_at: model.dateTime().nullable(),
    redeemed_order_id: model.text().nullable(),
    discount_amount_realized: model.bigNumber().nullable(),
    currency_code: model.text().default("nzd"),
  })
  .indexes([
    { on: ["code"], unique: true },
    { on: ["offer_id", "subscriber_id"], unique: true },
    { on: ["promotion_id"], unique: true },
    { on: ["status", "expires_at"] },
  ])

export default MarketingOfferIssuance
