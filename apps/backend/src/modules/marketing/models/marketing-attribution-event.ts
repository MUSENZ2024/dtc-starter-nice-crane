import { model } from "@medusajs/framework/utils"
import { MARKETING_ATTRIBUTION_EVENT_TYPES } from "../types"
import MarketingSubscriber from "./marketing-subscriber"
import MarketingEmailEvent from "./marketing-email-event"
import MarketingEnrollment from "./marketing-enrollment"

const MarketingAttributionEvent = model.define("marketing_attribution_event", {
  id: model.id().primaryKey(),
  subscriber: model.belongsTo(() => MarketingSubscriber, { mappedBy: "attribution_events" }),
  email_event: model.belongsTo(() => MarketingEmailEvent, { mappedBy: "attribution_events" }).nullable(),
  enrollment: model.belongsTo(() => MarketingEnrollment, { mappedBy: "attribution_events" }).nullable(),
  campaign_id: model.text().nullable(),
  event_type: model.enum([...MARKETING_ATTRIBUTION_EVENT_TYPES]),
  order_id: model.text(),
  amount: model.bigNumber(),
  discount_amount: model.bigNumber().default(0),
  currency_code: model.text().default("nzd"),
  occurred_at: model.dateTime(),
  metadata: model.json().nullable(),
}).indexes([
  { on: ["order_id"], unique: true },
  { on: ["subscriber_id"] },
  { on: ["event_type", "occurred_at"] },
])

export default MarketingAttributionEvent
