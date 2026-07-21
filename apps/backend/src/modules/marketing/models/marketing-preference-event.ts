import { model } from "@medusajs/framework/utils"
import MarketingSubscriber from "./marketing-subscriber"
import { MARKETING_PREFERENCES } from "../types"

const MarketingPreferenceEvent = model
  .define("marketing_preference_event", {
    id: model.id().primaryKey(),
    subscriber: model.belongsTo(() => MarketingSubscriber, {
      mappedBy: "preference_events",
    }),
    preference: model.enum([...MARKETING_PREFERENCES]),
    source: model.text(),
    occurred_at: model.dateTime(),
  })
  .indexes([{ on: ["subscriber_id"] }, { on: ["occurred_at"] }])

export default MarketingPreferenceEvent
