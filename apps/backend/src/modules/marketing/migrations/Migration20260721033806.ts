import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260721033806 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "marketing_campaign_recipient" drop constraint if exists "marketing_campaign_recipient_campaign_id_subscriber_id_unique";`);
    this.addSql(`alter table if exists "marketing_segment" drop constraint if exists "marketing_segment_key_unique";`);
    this.addSql(`alter table if exists "marketing_control" drop constraint if exists "marketing_control_key_unique";`);
    this.addSql(`alter table if exists "marketing_campaign" drop constraint if exists "marketing_campaign_utm_campaign_unique";`);
    this.addSql(`create table if not exists "marketing_campaign" ("id" text not null, "name" text not null, "status" text check ("status" in ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'failed')) not null default 'draft', "subject" text not null, "preview_text" text not null, "template_key" text not null default 'structured_campaign_v1', "content" jsonb not null, "audience_definition" jsonb not null, "audience_snapshot_count" integer not null default 0, "excluded_snapshot_count" integer not null default 0, "scheduled_at" timestamptz null, "started_at" timestamptz null, "completed_at" timestamptz null, "confirmed_at" timestamptz null, "test_sent_at" timestamptz null, "created_by" text null, "utm_campaign" text not null, "sender" text not null default 'MUSE NZ <hello@musenz.com>', "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketing_campaign_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_campaign_deleted_at" ON "marketing_campaign" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_campaign_status_scheduled_at" ON "marketing_campaign" ("status", "scheduled_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_marketing_campaign_utm_campaign_unique" ON "marketing_campaign" ("utm_campaign") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "marketing_control" ("id" text not null, "key" text not null, "global_pause" boolean not null default false, "monthly_safety_limit" integer not null default 9000, "daily_dispatch_cap" integer not null default 1350, "frequency_days" integer not null default 3, "updated_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketing_control_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_control_deleted_at" ON "marketing_control" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_marketing_control_key_unique" ON "marketing_control" ("key") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "marketing_segment" ("id" text not null, "key" text not null, "name" text not null, "description" text null, "status" text check ("status" in ('active', 'archived')) not null default 'active', "definition" jsonb not null, "estimated_count" integer not null default 0, "estimated_at" timestamptz null, "is_system" boolean not null default false, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketing_segment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_segment_deleted_at" ON "marketing_segment" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_marketing_segment_key_unique" ON "marketing_segment" ("key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_segment_status" ON "marketing_segment" ("status") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "marketing_campaign_recipient" ("id" text not null, "campaign_id" text not null, "subscriber_id" text not null, "email" text not null, "status" text check ("status" in ('eligible', 'excluded', 'scheduled', 'sent', 'failed', 'cancelled')) not null default 'eligible', "exclusion_reason" text null, "email_event_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketing_campaign_recipient_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_campaign_recipient_campaign_id" ON "marketing_campaign_recipient" ("campaign_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_campaign_recipient_subscriber_id" ON "marketing_campaign_recipient" ("subscriber_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_campaign_recipient_deleted_at" ON "marketing_campaign_recipient" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_marketing_campaign_recipient_campaign_id_subscriber_id_unique" ON "marketing_campaign_recipient" ("campaign_id", "subscriber_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_campaign_recipient_campaign_id_status" ON "marketing_campaign_recipient" ("campaign_id", "status") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "marketing_campaign_recipient" add constraint "marketing_campaign_recipient_campaign_id_foreign" foreign key ("campaign_id") references "marketing_campaign" ("id") on update cascade;`);
    this.addSql(`alter table if exists "marketing_campaign_recipient" add constraint "marketing_campaign_recipient_subscriber_id_foreign" foreign key ("subscriber_id") references "marketing_subscriber" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "marketing_campaign_recipient" drop constraint if exists "marketing_campaign_recipient_campaign_id_foreign";`);

    this.addSql(`drop table if exists "marketing_campaign" cascade;`);

    this.addSql(`drop table if exists "marketing_control" cascade;`);

    this.addSql(`drop table if exists "marketing_segment" cascade;`);

    this.addSql(`drop table if exists "marketing_campaign_recipient" cascade;`);
  }

}
