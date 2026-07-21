import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260721010000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "abandoned_cart_campaign" (
      "id" text not null,
      "cart_id" text not null,
      "customer_id" text null,
      "email" text not null,
      "customer_name" text not null default 'Guest customer',
      "segment" text check ("segment" in ('first_time', 'returning')) not null default 'first_time',
      "status" text check ("status" in ('active', 'recovered', 'expired', 'cancelled')) not null default 'active',
      "checkout_stage" text check ("checkout_stage" in ('cart', 'checkout')) not null default 'cart',
      "abandoned_at" timestamptz not null,
      "last_activity_at" timestamptz not null,
      "currency_code" text not null default 'nzd',
      "cart_value" numeric not null default 0,
      "item_count" integer not null default 0,
      "free_shipping_qualified" boolean not null default false,
      "free_shipping_remaining" numeric not null default 0,
      "last_email_status" text check ("last_email_status" in ('not_sent', 'scheduled', 'sending', 'sent', 'failed', 'cancelled')) not null default 'scheduled',
      "first_email_sent_at" timestamptz null,
      "last_email_sent_at" timestamptz null,
      "clicked_at" timestamptz null,
      "recovered_at" timestamptz null,
      "recovered_order_id" text null,
      "recovered_revenue" numeric null,
      "snapshot" jsonb not null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "abandoned_cart_campaign_pkey" primary key ("id")
    );`);
    this.addSql(
      `create unique index if not exists "IDX_ABANDONED_CART_CAMPAIGN_CART_UNIQUE" on "abandoned_cart_campaign" ("cart_id") where "deleted_at" is null;`,
    );
    this.addSql(
      `create index if not exists "IDX_ABANDONED_CART_CAMPAIGN_CUSTOMER" on "abandoned_cart_campaign" ("customer_id") where "deleted_at" is null;`,
    );
    this.addSql(
      `create index if not exists "IDX_ABANDONED_CART_CAMPAIGN_EMAIL" on "abandoned_cart_campaign" ("email") where "deleted_at" is null;`,
    );
    this.addSql(
      `create index if not exists "IDX_ABANDONED_CART_CAMPAIGN_ABANDONED" on "abandoned_cart_campaign" ("abandoned_at") where "deleted_at" is null;`,
    );
    this.addSql(
      `create index if not exists "IDX_ABANDONED_CART_CAMPAIGN_ORDER" on "abandoned_cart_campaign" ("recovered_order_id") where "deleted_at" is null;`,
    );

    this.addSql(`create table if not exists "abandoned_cart_email_event" (
      "id" text not null,
      "campaign_id" text not null,
      "cart_id" text not null,
      "sequence_number" integer not null,
      "template_key" text check ("template_key" in ('visual_reminder', 'personal_follow_up', 'urgency_reminder')) not null,
      "subject" text not null,
      "status" text check ("status" in ('scheduled', 'sending', 'sent', 'failed', 'cancelled')) not null default 'scheduled',
      "scheduled_at" timestamptz not null,
      "sent_at" timestamptz null,
      "failed_at" timestamptz null,
      "cancelled_at" timestamptz null,
      "clicked_at" timestamptz null,
      "tracking_token" text not null,
      "provider_notification_id" text null,
      "error_message" text null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "abandoned_cart_email_event_pkey" primary key ("id")
    );`);
    this.addSql(
      `create index if not exists "IDX_ABANDONED_CART_EMAIL_CAMPAIGN" on "abandoned_cart_email_event" ("campaign_id") where "deleted_at" is null;`,
    );
    this.addSql(
      `create index if not exists "IDX_ABANDONED_CART_EMAIL_CART" on "abandoned_cart_email_event" ("cart_id") where "deleted_at" is null;`,
    );
    this.addSql(
      `create index if not exists "IDX_ABANDONED_CART_EMAIL_SCHEDULED" on "abandoned_cart_email_event" ("scheduled_at") where "deleted_at" is null;`,
    );
    this.addSql(
      `create unique index if not exists "IDX_ABANDONED_CART_EMAIL_TRACKING_UNIQUE" on "abandoned_cart_email_event" ("tracking_token") where "deleted_at" is null;`,
    );
    this.addSql(
      `create unique index if not exists "IDX_ABANDONED_CART_EMAIL_SEQUENCE_UNIQUE" on "abandoned_cart_email_event" ("campaign_id", "sequence_number") where "deleted_at" is null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "abandoned_cart_email_event" cascade;`);
    this.addSql(`drop table if exists "abandoned_cart_campaign" cascade;`);
  }
}
