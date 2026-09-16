import { model } from "@medusajs/framework/utils";

const TrackingSample = model
  .define("tracking_sample", {
    id: model.id().primaryKey(),
    sample_key: model.text(),
    tracking_hash: model.text(),
    route_key: model.text(),
    carrier_family: model.text(),
    origin_country: model.text(),
    destination_country: model.text(),
    stage: model.text(),
    observed_at: model.dateTime(),
    delivered_at: model.dateTime(),
    remaining_hours: model.float(),
  })
  .indexes([
    { on: ["sample_key"], unique: true },
    { on: ["route_key", "carrier_family", "stage"] },
    { on: ["stage"] },
    { on: ["delivered_at"] },
  ]);

export default TrackingSample;
