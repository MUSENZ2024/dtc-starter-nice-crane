import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260721025204 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "marketing_email_event" drop constraint if exists "marketing_email_event_enrollment_id_flow_step_id_unique";`);
    this.addSql(`alter table if exists "marketing_email_event" drop constraint if exists "marketing_email_event_tracking_token_unique";`);
    this.addSql(`alter table if exists "marketing_enrollment" drop constraint if exists "marketing_enrollment_subscriber_id_flow_id_flow_version_unique";`);
    this.addSql(`alter table if exists "marketing_flow_step" drop constraint if exists "marketing_flow_step_flow_id_sequence_number_unique";`);
    this.addSql(`alter table if exists "marketing_flow" drop constraint if exists "marketing_flow_key_unique";`);
    this.addSql(`create table if not exists "marketing_flow" ("id" text not null, "key" text not null, "name" text not null, "type" text check ("type" in ('welcome', 'vip_welcome', 'winback', 'restock', 'custom')) not null, "status" text check ("status" in ('draft', 'active', 'paused', 'archived')) not null default 'draft', "version" integer not null default 1, "entry_rules" jsonb null, "exit_rules" jsonb null, "frequency_rules" jsonb null, "activated_at" timestamptz null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketing_flow_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_flow_deleted_at" ON "marketing_flow" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_marketing_flow_key_unique" ON "marketing_flow" ("key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_flow_status" ON "marketing_flow" ("status") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "marketing_flow_step" ("id" text not null, "flow_id" text not null, "sequence_number" integer not null, "name" text not null, "template_key" text not null, "delay_minutes" integer not null, "subject" text not null, "preview_text" text not null, "status" text check ("status" in ('draft', 'active', 'paused')) not null default 'active', "audience_rules" jsonb null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketing_flow_step_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_flow_step_flow_id" ON "marketing_flow_step" ("flow_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_flow_step_deleted_at" ON "marketing_flow_step" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_marketing_flow_step_flow_id_sequence_number_unique" ON "marketing_flow_step" ("flow_id", "sequence_number") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_flow_step_template_key" ON "marketing_flow_step" ("template_key") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "marketing_enrollment" ("id" text not null, "subscriber_id" text not null, "flow_id" text not null, "flow_version" integer not null, "status" text check ("status" in ('active', 'completed', 'converted', 'cancelled', 'unsubscribed', 'suppressed')) not null default 'active', "entered_at" timestamptz not null, "completed_at" timestamptz null, "cancelled_at" timestamptz null, "cancel_reason" text null, "converted_order_id" text null, "converted_at" timestamptz null, "attributed_revenue" numeric null, "attribution_currency" text null, "source" text check ("source" in ('welcome_popup', 'homepage_drop_access', 'footer_signup', 'checkout_opt_in', 'account_opt_in', 'admin_import', 'admin_manual', 'campaign_landing_page')) not null, "metadata" jsonb null, "raw_attributed_revenue" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketing_enrollment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_enrollment_subscriber_id" ON "marketing_enrollment" ("subscriber_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_enrollment_flow_id" ON "marketing_enrollment" ("flow_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_enrollment_deleted_at" ON "marketing_enrollment" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_marketing_enrollment_subscriber_id_flow_id_flow_version_unique" ON "marketing_enrollment" ("subscriber_id", "flow_id", "flow_version") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_enrollment_status" ON "marketing_enrollment" ("status") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "marketing_email_event" ("id" text not null, "subscriber_id" text not null, "enrollment_id" text null, "campaign_id" text null, "flow_step_id" text null, "template_key" text not null, "subject_snapshot" text not null, "preview_text_snapshot" text not null, "status" text check ("status" in ('scheduled', 'sending', 'sent', 'delivered', 'opened', 'clicked', 'failed', 'cancelled', 'bounced', 'complained')) not null default 'scheduled', "scheduled_at" timestamptz not null, "send_started_at" timestamptz null, "sent_at" timestamptz null, "delivered_at" timestamptz null, "first_opened_at" timestamptz null, "first_clicked_at" timestamptz null, "failed_at" timestamptz null, "cancelled_at" timestamptz null, "provider_notification_id" text null, "attempt_count" integer not null default 0, "last_error" text null, "tracking_token" text not null, "content_snapshot" jsonb null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketing_email_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_email_event_subscriber_id" ON "marketing_email_event" ("subscriber_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_email_event_enrollment_id" ON "marketing_email_event" ("enrollment_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_email_event_flow_step_id" ON "marketing_email_event" ("flow_step_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_email_event_deleted_at" ON "marketing_email_event" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_marketing_email_event_tracking_token_unique" ON "marketing_email_event" ("tracking_token") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_marketing_email_event_enrollment_id_flow_step_id_unique" ON "marketing_email_event" ("enrollment_id", "flow_step_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_email_event_status_scheduled_at" ON "marketing_email_event" ("status", "scheduled_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "marketing_flow_step" add constraint "marketing_flow_step_flow_id_foreign" foreign key ("flow_id") references "marketing_flow" ("id") on update cascade;`);

    this.addSql(`alter table if exists "marketing_enrollment" add constraint "marketing_enrollment_subscriber_id_foreign" foreign key ("subscriber_id") references "marketing_subscriber" ("id") on update cascade;`);
    this.addSql(`alter table if exists "marketing_enrollment" add constraint "marketing_enrollment_flow_id_foreign" foreign key ("flow_id") references "marketing_flow" ("id") on update cascade;`);

    this.addSql(`alter table if exists "marketing_email_event" add constraint "marketing_email_event_subscriber_id_foreign" foreign key ("subscriber_id") references "marketing_subscriber" ("id") on update cascade;`);
    this.addSql(`alter table if exists "marketing_email_event" add constraint "marketing_email_event_enrollment_id_foreign" foreign key ("enrollment_id") references "marketing_enrollment" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table if exists "marketing_email_event" add constraint "marketing_email_event_flow_step_id_foreign" foreign key ("flow_step_id") references "marketing_flow_step" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "marketing_flow_step" drop constraint if exists "marketing_flow_step_flow_id_foreign";`);

    this.addSql(`alter table if exists "marketing_enrollment" drop constraint if exists "marketing_enrollment_flow_id_foreign";`);

    this.addSql(`alter table if exists "marketing_email_event" drop constraint if exists "marketing_email_event_flow_step_id_foreign";`);

    this.addSql(`alter table if exists "marketing_email_event" drop constraint if exists "marketing_email_event_enrollment_id_foreign";`);

    this.addSql(`drop table if exists "marketing_flow" cascade;`);

    this.addSql(`drop table if exists "marketing_flow_step" cascade;`);

    this.addSql(`drop table if exists "marketing_enrollment" cascade;`);

    this.addSql(`drop table if exists "marketing_email_event" cascade;`);
  }

}
