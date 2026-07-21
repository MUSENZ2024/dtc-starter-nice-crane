import { model } from "@medusajs/framework/utils"
import { MARKETING_FLOW_STEP_STATUSES } from "../types"
import MarketingFlow from "./marketing-flow"
import MarketingEmailEvent from "./marketing-email-event"

const MarketingFlowStep = model.define("marketing_flow_step", {
  id: model.id().primaryKey(), flow: model.belongsTo(() => MarketingFlow, { mappedBy: "steps" }), sequence_number: model.number(),
  name: model.text(), template_key: model.text(), delay_minutes: model.number(), subject: model.text(), preview_text: model.text(),
  status: model.enum([...MARKETING_FLOW_STEP_STATUSES]).default("active"), audience_rules: model.json().nullable(), metadata: model.json().nullable(),
  email_events: model.hasMany(() => MarketingEmailEvent, { mappedBy: "flow_step" }),
}).indexes([{ on: ["flow_id", "sequence_number"], unique: true }, { on: ["template_key"] }])

export default MarketingFlowStep
