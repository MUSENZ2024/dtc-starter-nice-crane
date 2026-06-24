import { model } from "@medusajs/framework/utils"

const ScheduledEmail = model.define("muse_scheduled_email", {
  id: model.id().primaryKey(),
  template_key: model.text().index("IDX_MUSE_SCHEDULED_EMAIL_TEMPLATE"),
  order_id: model.text().index("IDX_MUSE_SCHEDULED_EMAIL_ORDER"),
  note: model.text().nullable(),
  send_at: model.dateTime().index("IDX_MUSE_SCHEDULED_EMAIL_SEND_AT"),
  status: model.enum(["pending", "sent", "failed"]).default("pending"),
  sent_at: model.dateTime().nullable(),
  last_error: model.text().nullable(),
})

export default ScheduledEmail
