export type CampaignStatus = "active" | "recovered" | "expired" | "cancelled";
export type EmailStatus =
  | "not_sent"
  | "scheduled"
  | "sending"
  | "sent"
  | "failed"
  | "cancelled";

export type AbandonedCartCampaign = {
  id: string;
  cart_id: string;
  customer_id?: string | null;
  email: string;
  customer_name: string;
  segment: "first_time" | "returning";
  status: CampaignStatus;
  checkout_stage: "cart" | "checkout";
  abandoned_at: string;
  last_activity_at: string;
  currency_code: string;
  cart_value: number;
  item_count: number;
  free_shipping_qualified: boolean;
  free_shipping_remaining: number;
  last_email_status: EmailStatus;
  first_email_sent_at?: string | null;
  last_email_sent_at?: string | null;
  clicked_at?: string | null;
  recovered_at?: string | null;
  recovered_order_id?: string | null;
  recovered_revenue?: number | null;
  snapshot: Record<string, any>;
};

export type AbandonedCartEmailEvent = {
  id: string;
  campaign_id: string;
  sequence_number: number;
  template_key: string;
  subject: string;
  status: Exclude<EmailStatus, "not_sent">;
  scheduled_at: string;
  sent_at?: string | null;
  failed_at?: string | null;
  cancelled_at?: string | null;
  clicked_at?: string | null;
  error_message?: string | null;
};

export const money = (amount: number | null | undefined, currency = "nzd") =>
  new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: currency.toUpperCase(),
    currencyDisplay: "narrowSymbol",
  }).format(amount || 0);

export const dateTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-NZ", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
