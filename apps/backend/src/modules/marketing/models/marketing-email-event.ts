import { model } from "@medusajs/framework/utils"
import { MARKETING_EMAIL_EVENT_STATUSES } from "../types"
import MarketingSubscriber from "./marketing-subscriber"
import MarketingEnrollment from "./marketing-enrollment"
import MarketingFlowStep from "./marketing-flow-step"
import MarketingAttributionEvent from "./marketing-attribution-event"

const MarketingEmailEvent = model.define("marketing_email_event", {
  id: model.id().primaryKey(), subscriber: model.belongsTo(() => MarketingSubscriber, { mappedBy: "email_events" }), enrollment: model.belongsTo(() => MarketingEnrollment, { mappedBy: "email_events" }).nullable(),
  campaign_id: model.text().nullable(), flow_step: model.belongsTo(() => MarketingFlowStep, { mappedBy: "email_events" }).nullable(), template_key: model.text(),
  subject_snapshot: model.text(), preview_text_snapshot: model.text(), status: model.enum([...MARKETING_EMAIL_EVENT_STATUSES]).default("scheduled"), scheduled_at: model.dateTime(),
  send_started_at: model.dateTime().nullable(), sent_at: model.dateTime().nullable(), delivered_at: model.dateTime().nullable(), first_opened_at: model.dateTime().nullable(), first_clicked_at: model.dateTime().nullable(),
  failed_at: model.dateTime().nullable(), cancelled_at: model.dateTime().nullable(), provider_notification_id: model.text().nullable(), attempt_count: model.number().default(0),
  last_error: model.text().nullable(), tracking_token: model.text(), content_snapshot: model.json().nullable(), metadata: model.json().nullable(),
  attribution_events: model.hasMany(() => MarketingAttributionEvent, { mappedBy: "email_event" }),
}).indexes([{ on: ["tracking_token"], unique: true }, { on: ["enrollment_id", "flow_step_id"], unique: true }, { on: ["status", "scheduled_at"] }])

export default MarketingEmailEvent
