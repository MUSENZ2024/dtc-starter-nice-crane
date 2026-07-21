import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260721021601 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "marketing_offer_issuance" drop constraint if exists "marketing_offer_issuance_promotion_id_unique";`);
    this.addSql(`alter table if exists "marketing_offer_issuance" drop constraint if exists "marketing_offer_issuance_offer_id_subscriber_id_unique";`);
    this.addSql(`alter table if exists "marketing_offer_issuance" drop constraint if exists "marketing_offer_issuance_code_unique";`);
    this.addSql(`alter table if exists "marketing_offer" drop constraint if exists "marketing_offer_key_unique";`);
    this.addSql(`create table if not exists "marketing_offer" ("id" text not null, "key" text not null, "name" text not null, "status" text check ("status" in ('draft', 'active', 'paused', 'archived')) not null default 'draft', "amount_type" text check ("amount_type" in ('fixed', 'percentage')) not null default 'fixed', "amount" numeric not null, "currency_code" text not null default 'nzd', "minimum_spend" numeric not null, "expires_after_hours" integer not null, "first_order_only" boolean not null default true, "combinable" boolean not null default false, "excluded_product_ids" jsonb null, "excluded_category_ids" jsonb null, "excluded_tag_ids" jsonb null, "metadata" jsonb null, "raw_amount" jsonb not null, "raw_minimum_spend" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketing_offer_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_offer_deleted_at" ON "marketing_offer" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_marketing_offer_key_unique" ON "marketing_offer" ("key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_offer_status" ON "marketing_offer" ("status") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "marketing_offer_issuance" ("id" text not null, "offer_id" text not null, "subscriber_id" text not null, "promotion_id" text not null, "code" text not null, "status" text check ("status" in ('active', 'redeemed', 'expired', 'revoked')) not null default 'active', "issued_at" timestamptz not null, "expires_at" timestamptz not null, "redeemed_at" timestamptz null, "redeemed_order_id" text null, "discount_amount_realized" numeric null, "currency_code" text not null default 'nzd', "raw_discount_amount_realized" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketing_offer_issuance_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_offer_issuance_offer_id" ON "marketing_offer_issuance" ("offer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_offer_issuance_subscriber_id" ON "marketing_offer_issuance" ("subscriber_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_offer_issuance_deleted_at" ON "marketing_offer_issuance" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_marketing_offer_issuance_code_unique" ON "marketing_offer_issuance" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_marketing_offer_issuance_offer_id_subscriber_id_unique" ON "marketing_offer_issuance" ("offer_id", "subscriber_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_marketing_offer_issuance_promotion_id_unique" ON "marketing_offer_issuance" ("promotion_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_offer_issuance_status_expires_at" ON "marketing_offer_issuance" ("status", "expires_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "marketing_offer_issuance" add constraint "marketing_offer_issuance_offer_id_foreign" foreign key ("offer_id") references "marketing_offer" ("id") on update cascade;`);
    this.addSql(`alter table if exists "marketing_offer_issuance" add constraint "marketing_offer_issuance_subscriber_id_foreign" foreign key ("subscriber_id") references "marketing_subscriber" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "marketing_offer_issuance" drop constraint if exists "marketing_offer_issuance_offer_id_foreign";`);

    this.addSql(`drop table if exists "marketing_offer" cascade;`);

    this.addSql(`drop table if exists "marketing_offer_issuance" cascade;`);
  }

}
