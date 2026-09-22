import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260918000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "item_request" ("id" text not null, "item_name" text not null, "item_type" text check ("item_type" in ('bag', 'watch', 'wallet', 'accessory', 'other')) not null, "details" text null, "requester_name" text not null, "email" text not null, "phone" text null, "image_url" text not null, "image_file_id" text not null, "status" text check ("status" in ('pending', 'reviewing', 'quoted', 'closed')) not null default 'pending', "admin_note" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "item_request_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_item_request_deleted_at" ON "item_request" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_item_request_status_created_at" ON "item_request" ("status", "created_at") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "item_request" cascade;`)
  }
}
