import { model } from "@medusajs/framework/utils"

const MarketingControl = model.define("marketing_control", {
  id: model.id().primaryKey(),
  key: model.text(),
  global_pause: model.boolean().default(false),
  monthly_safety_limit: model.number().default(9000),
  daily_dispatch_cap: model.number().default(1350),
  frequency_days: model.number().default(3),
  updated_by: model.text().nullable(),
}).indexes([{ on: ["key"], unique: true }])

export default MarketingControl
