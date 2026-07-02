import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260702000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "review" ("id" text not null, "title" text null, "content" text not null, "rating" real not null, "reviewer_name" text not null, "reviewer_email" text null, "product_id" text null, "image_url" text null, "source" text check ("source" in ('legacy', 'customer')) not null default 'customer', "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending', "verified_purchase" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "review_pkey" primary key ("id"), constraint "review_rating_range" check ("rating" >= 1 and "rating" <= 5));`
    )
    this.addSql(
      `create index if not exists "IDX_REVIEW_PRODUCT_ID" on "review" ("product_id") where "deleted_at" is null;`
    )
    this.addSql(
      `create index if not exists "IDX_review_deleted_at" on "review" ("deleted_at") where "deleted_at" is null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "review" cascade;`)
  }
}
