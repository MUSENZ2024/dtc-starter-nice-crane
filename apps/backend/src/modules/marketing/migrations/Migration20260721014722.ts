import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260721014722 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "marketing_subscriber" drop constraint if exists "marketing_subscriber_email_normalized_unique";`);
    this.addSql(`create table if not exists "marketing_subscriber" ("id" text not null, "email" text not null, "email_normalized" text not null, "customer_id" text null, "first_name" text null, "last_name" text null, "status" text check ("status" in ('subscribed', 'unsubscribed', 'suppressed', 'pending')) not null default 'subscribed', "customer_type" text check ("customer_type" in ('first_time', 'returning', 'unknown')) not null default 'unknown', "primary_preference" text check ("primary_preference" in ('footwear', 'outerwear', 'restocks', 'everything')) not null default 'everything', "source_first" text not null, "source_latest" text not null, "subscribed_at" timestamptz not null, "unsubscribed_at" timestamptz null, "suppressed_at" timestamptz null, "suppression_reason" text null, "last_email_sent_at" timestamptz null, "last_engaged_at" timestamptz null, "order_count" integer not null default 0, "lifetime_revenue" numeric not null default 0, "metadata" jsonb null, "raw_lifetime_revenue" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketing_subscriber_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_subscriber_deleted_at" ON "marketing_subscriber" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_marketing_subscriber_email_normalized_unique" ON "marketing_subscriber" ("email_normalized") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_subscriber_customer_id" ON "marketing_subscriber" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_subscriber_status" ON "marketing_subscriber" ("status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_subscriber_primary_preference" ON "marketing_subscriber" ("primary_preference") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_subscriber_subscribed_at" ON "marketing_subscriber" ("subscribed_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_subscriber_last_engaged_at" ON "marketing_subscriber" ("last_engaged_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "marketing_preference_event" ("id" text not null, "subscriber_id" text not null, "preference" text check ("preference" in ('footwear', 'outerwear', 'restocks', 'everything')) not null, "source" text not null, "occurred_at" timestamptz not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketing_preference_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_preference_event_subscriber_id" ON "marketing_preference_event" ("subscriber_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_preference_event_deleted_at" ON "marketing_preference_event" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_preference_event_occurred_at" ON "marketing_preference_event" ("occurred_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "marketing_consent_event" ("id" text not null, "subscriber_id" text not null, "action" text check ("action" in ('subscribed', 'unsubscribed', 'resubscribed', 'suppressed', 'consent_updated')) not null, "channel" text check ("channel" in ('email')) not null default 'email', "source" text not null, "consent_text" text not null, "privacy_policy_version" text not null, "occurred_at" timestamptz not null, "ip_hash" text null, "user_agent_summary" text null, "country_code" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketing_consent_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_consent_event_subscriber_id" ON "marketing_consent_event" ("subscriber_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_consent_event_deleted_at" ON "marketing_consent_event" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_consent_event_action" ON "marketing_consent_event" ("action") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_consent_event_occurred_at" ON "marketing_consent_event" ("occurred_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "marketing_preference_event" add constraint "marketing_preference_event_subscriber_id_foreign" foreign key ("subscriber_id") references "marketing_subscriber" ("id") on update cascade;`);

    this.addSql(`alter table if exists "marketing_consent_event" add constraint "marketing_consent_event_subscriber_id_foreign" foreign key ("subscriber_id") references "marketing_subscriber" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "marketing_preference_event" drop constraint if exists "marketing_preference_event_subscriber_id_foreign";`);

    this.addSql(`alter table if exists "marketing_consent_event" drop constraint if exists "marketing_consent_event_subscriber_id_foreign";`);

    this.addSql(`drop table if exists "marketing_subscriber" cascade;`);

    this.addSql(`drop table if exists "marketing_preference_event" cascade;`);

    this.addSql(`drop table if exists "marketing_consent_event" cascade;`);
  }

}
