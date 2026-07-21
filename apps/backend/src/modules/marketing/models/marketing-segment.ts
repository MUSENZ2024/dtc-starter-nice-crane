import { model } from "@medusajs/framework/utils"
import { MARKETING_SEGMENT_STATUSES } from "../types"

const MarketingSegment = model.define("marketing_segment", {
  id: model.id().primaryKey(),
  key: model.text(),
  name: model.text(),
  description: model.text().nullable(),
  status: model.enum([...MARKETING_SEGMENT_STATUSES]).default("active"),
  definition: model.json(),
  estimated_count: model.number().default(0),
  estimated_at: model.dateTime().nullable(),
  is_system: model.boolean().default(false),
  metadata: model.json().nullable(),
}).indexes([{ on: ["key"], unique: true }, { on: ["status"] }])

export default MarketingSegment
