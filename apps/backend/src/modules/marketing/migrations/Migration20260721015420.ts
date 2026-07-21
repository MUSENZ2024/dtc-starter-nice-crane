import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260721015420 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "marketing_capture_event" ("id" text not null, "session_id_hash" text not null, "subscriber_id" text null, "event_type" text check ("event_type" in ('eligible', 'popup_viewed', 'preference_selected', 'form_viewed', 'submitted', 'succeeded', 'dismissed', 'error')) not null, "source" text not null, "preference" text check ("preference" in ('footwear', 'outerwear', 'restocks', 'everything')) null, "page_type" text not null, "device_type" text check ("device_type" in ('mobile', 'desktop')) not null, "occurred_at" timestamptz not null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketing_capture_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_capture_event_deleted_at" ON "marketing_capture_event" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_capture_event_session_id_hash" ON "marketing_capture_event" ("session_id_hash") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_capture_event_subscriber_id" ON "marketing_capture_event" ("subscriber_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_capture_event_event_type" ON "marketing_capture_event" ("event_type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_capture_event_occurred_at" ON "marketing_capture_event" ("occurred_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "marketing_capture_event" cascade;`);
  }

}
