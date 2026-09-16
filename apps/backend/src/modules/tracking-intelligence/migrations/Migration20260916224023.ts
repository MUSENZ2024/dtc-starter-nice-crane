import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260916224023 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "active_tracking" drop constraint if exists "active_tracking_tracking_hash_unique";`);
    this.addSql(`create table if not exists "active_tracking" ("id" text not null, "tracking_hash" text not null, "encrypted_number" text not null, "status" text not null, "stage" text not null, "active" boolean not null default true, "last_checked_at" timestamptz not null, "next_check_at" timestamptz not null, "last_event_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "active_tracking_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_active_tracking_deleted_at" ON "active_tracking" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_active_tracking_tracking_hash_unique" ON "active_tracking" ("tracking_hash") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_active_tracking_active_next_check_at" ON "active_tracking" ("active", "next_check_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "active_tracking" cascade;`);
  }

}
