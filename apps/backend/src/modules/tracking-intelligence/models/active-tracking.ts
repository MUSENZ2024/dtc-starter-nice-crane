import { model } from "@medusajs/framework/utils";

const ActiveTracking = model
  .define("active_tracking", {
    id: model.id().primaryKey(),
    tracking_hash: model.text(),
    encrypted_number: model.text(),
    status: model.text(),
    stage: model.text(),
    active: model.boolean().default(true),
    last_checked_at: model.dateTime(),
    next_check_at: model.dateTime(),
    last_event_at: model.dateTime().nullable(),
  })
  .indexes([
    { on: ["tracking_hash"], unique: true },
    { on: ["active", "next_check_at"] },
  ]);

export default ActiveTracking;
