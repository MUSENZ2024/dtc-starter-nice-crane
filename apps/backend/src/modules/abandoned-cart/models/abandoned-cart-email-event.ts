import { model } from "@medusajs/framework/utils";

const AbandonedCartEmailEvent = model.define("abandoned_cart_email_event", {
  id: model.id().primaryKey(),
  campaign_id: model.text().index("IDX_ABANDONED_CART_EMAIL_CAMPAIGN"),
  cart_id: model.text().index("IDX_ABANDONED_CART_EMAIL_CART"),
  sequence_number: model.number(),
  template_key: model.enum([
    "visual_reminder",
    "personal_follow_up",
    "urgency_reminder",
  ]),
  subject: model.text(),
  status: model
    .enum(["scheduled", "sending", "sent", "failed", "cancelled"])
    .default("scheduled"),
  scheduled_at: model.dateTime().index("IDX_ABANDONED_CART_EMAIL_SCHEDULED"),
  sent_at: model.dateTime().nullable(),
  failed_at: model.dateTime().nullable(),
  cancelled_at: model.dateTime().nullable(),
  clicked_at: model.dateTime().nullable(),
  tracking_token: model.text().index("IDX_ABANDONED_CART_EMAIL_TRACKING"),
  provider_notification_id: model.text().nullable(),
  error_message: model.text().nullable(),
});

export default AbandonedCartEmailEvent;
