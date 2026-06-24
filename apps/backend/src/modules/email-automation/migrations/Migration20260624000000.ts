import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260624000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "muse_email_template" ("id" text not null, "key" text not null, "name" text not null, "subject" text not null, "html" text not null, "enabled" boolean not null default true, "delay_minutes" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "muse_email_template_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_muse_email_template_key_unique" ON "muse_email_template" ("key") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_muse_email_template_deleted_at" ON "muse_email_template" (deleted_at) WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `create table if not exists "muse_scheduled_email" ("id" text not null, "template_key" text not null, "order_id" text not null, "note" text null, "send_at" timestamptz not null, "status" text check ("status" in ('pending', 'sent', 'failed')) not null default 'pending', "sent_at" timestamptz null, "last_error" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "muse_scheduled_email_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_MUSE_SCHEDULED_EMAIL_TEMPLATE" ON "muse_scheduled_email" (template_key) WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_MUSE_SCHEDULED_EMAIL_ORDER" ON "muse_scheduled_email" (order_id) WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_MUSE_SCHEDULED_EMAIL_SEND_AT" ON "muse_scheduled_email" (send_at) WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_muse_scheduled_email_deleted_at" ON "muse_scheduled_email" (deleted_at) WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "muse_scheduled_email" cascade;`)
    this.addSql(`drop table if exists "muse_email_template" cascade;`)
  }
}
