import { model } from "@medusajs/framework/utils"
import { MARKETING_FLOW_STATUSES, MARKETING_FLOW_TYPES } from "../types"
import MarketingFlowStep from "./marketing-flow-step"
import MarketingEnrollment from "./marketing-enrollment"

const MarketingFlow = model.define("marketing_flow", {
  id: model.id().primaryKey(), key: model.text(), name: model.text(),
  type: model.enum([...MARKETING_FLOW_TYPES]), status: model.enum([...MARKETING_FLOW_STATUSES]).default("draft"),
  version: model.number().default(1), entry_rules: model.json().nullable(), exit_rules: model.json().nullable(), frequency_rules: model.json().nullable(),
  activated_at: model.dateTime().nullable(), metadata: model.json().nullable(),
  steps: model.hasMany(() => MarketingFlowStep, { mappedBy: "flow" }),
  enrollments: model.hasMany(() => MarketingEnrollment, { mappedBy: "flow" }),
}).indexes([{ on: ["key"], unique: true }, { on: ["status"] }])

export default MarketingFlow
