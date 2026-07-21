import { model } from "@medusajs/framework/utils";

const AbandonedCartCampaign = model.define("abandoned_cart_campaign", {
  id: model.id().primaryKey(),
  cart_id: model.text().index("IDX_ABANDONED_CART_CAMPAIGN_CART"),
  customer_id: model
    .text()
    .index("IDX_ABANDONED_CART_CAMPAIGN_CUSTOMER")
    .nullable(),
  email: model.text().index("IDX_ABANDONED_CART_CAMPAIGN_EMAIL"),
  customer_name: model.text().default("Guest customer"),
  segment: model.enum(["first_time", "returning"]).default("first_time"),
  status: model
    .enum(["active", "recovered", "expired", "cancelled"])
    .default("active"),
  checkout_stage: model.enum(["cart", "checkout"]).default("cart"),
  abandoned_at: model.dateTime().index("IDX_ABANDONED_CART_CAMPAIGN_ABANDONED"),
  last_activity_at: model.dateTime(),
  currency_code: model.text().default("nzd"),
  cart_value: model.bigNumber().default(0),
  item_count: model.number().default(0),
  free_shipping_qualified: model.boolean().default(false),
  free_shipping_remaining: model.bigNumber().default(0),
  last_email_status: model
    .enum(["not_sent", "scheduled", "sending", "sent", "failed", "cancelled"])
    .default("scheduled"),
  first_email_sent_at: model.dateTime().nullable(),
  last_email_sent_at: model.dateTime().nullable(),
  clicked_at: model.dateTime().nullable(),
  recovered_at: model.dateTime().nullable(),
  recovered_order_id: model
    .text()
    .index("IDX_ABANDONED_CART_CAMPAIGN_ORDER")
    .nullable(),
  recovered_revenue: model.bigNumber().nullable(),
  snapshot: model.json(),
});

export default AbandonedCartCampaign;
