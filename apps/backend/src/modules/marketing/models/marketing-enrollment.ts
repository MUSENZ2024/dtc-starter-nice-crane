import { model } from "@medusajs/framework/utils"
import { MARKETING_ENROLLMENT_STATUSES, MARKETING_SOURCES } from "../types"
import MarketingSubscriber from "./marketing-subscriber"
import MarketingFlow from "./marketing-flow"
import MarketingEmailEvent from "./marketing-email-event"
import MarketingAttributionEvent from "./marketing-attribution-event"

const MarketingEnrollment = model.define("marketing_enrollment", {
  id: model.id().primaryKey(), subscriber: model.belongsTo(() => MarketingSubscriber, { mappedBy: "enrollments" }), flow: model.belongsTo(() => MarketingFlow, { mappedBy: "enrollments" }),
  flow_version: model.number(), status: model.enum([...MARKETING_ENROLLMENT_STATUSES]).default("active"), entered_at: model.dateTime(), completed_at: model.dateTime().nullable(),
  cancelled_at: model.dateTime().nullable(), cancel_reason: model.text().nullable(), converted_order_id: model.text().nullable(), converted_at: model.dateTime().nullable(),
  attributed_revenue: model.bigNumber().nullable(), attribution_currency: model.text().nullable(), source: model.enum([...MARKETING_SOURCES]), metadata: model.json().nullable(),
  email_events: model.hasMany(() => MarketingEmailEvent, { mappedBy: "enrollment" }),
  attribution_events: model.hasMany(() => MarketingAttributionEvent, { mappedBy: "enrollment" }),
}).indexes([{ on: ["subscriber_id", "flow_id", "flow_version"], unique: true }, { on: ["status"] }])

export default MarketingEnrollment
