import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260916222222 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "tracking_sample" drop constraint if exists "tracking_sample_sample_key_unique";`);
    this.addSql(`create table if not exists "tracking_sample" ("id" text not null, "sample_key" text not null, "tracking_hash" text not null, "route_key" text not null, "carrier_family" text not null, "origin_country" text not null, "destination_country" text not null, "stage" text not null, "observed_at" timestamptz not null, "delivered_at" timestamptz not null, "remaining_hours" real not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "tracking_sample_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tracking_sample_deleted_at" ON "tracking_sample" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_tracking_sample_sample_key_unique" ON "tracking_sample" ("sample_key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tracking_sample_route_key_carrier_family_stage" ON "tracking_sample" ("route_key", "carrier_family", "stage") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tracking_sample_stage" ON "tracking_sample" ("stage") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tracking_sample_delivered_at" ON "tracking_sample" ("delivered_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "tracking_sample" cascade;`);
  }

}
