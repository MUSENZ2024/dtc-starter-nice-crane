import { model } from "@medusajs/framework/utils"
import { MARKETING_CAPTURE_EVENT_TYPES, MARKETING_PREFERENCES } from "../types"

const MarketingCaptureEvent = model
  .define("marketing_capture_event", {
    id: model.id().primaryKey(),
    session_id_hash: model.text(),
    subscriber_id: model.text().nullable(),
    event_type: model.enum([...MARKETING_CAPTURE_EVENT_TYPES]),
    source: model.text(),
    preference: model.enum([...MARKETING_PREFERENCES]).nullable(),
    page_type: model.text(),
    device_type: model.enum(["mobile", "desktop"]),
    occurred_at: model.dateTime(),
    metadata: model.json().nullable(),
  })
  .indexes([
    { on: ["session_id_hash"] },
    { on: ["subscriber_id"] },
    { on: ["event_type"] },
    { on: ["occurred_at"] },
  ])

export default MarketingCaptureEvent
