import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260721032541 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "marketing_attribution_event" drop constraint if exists "marketing_attribution_event_order_id_unique";`);
    this.addSql(`create table if not exists "marketing_attribution_event" ("id" text not null, "subscriber_id" text not null, "email_event_id" text null, "enrollment_id" text null, "campaign_id" text null, "event_type" text check ("event_type" in ('promotion', 'last_click', 'last_open', 'unattributed')) not null, "order_id" text not null, "amount" numeric not null, "discount_amount" numeric not null default 0, "currency_code" text not null default 'nzd', "occurred_at" timestamptz not null, "metadata" jsonb null, "raw_amount" jsonb not null, "raw_discount_amount" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketing_attribution_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_attribution_event_subscriber_id" ON "marketing_attribution_event" ("subscriber_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_attribution_event_email_event_id" ON "marketing_attribution_event" ("email_event_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_attribution_event_enrollment_id" ON "marketing_attribution_event" ("enrollment_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_attribution_event_deleted_at" ON "marketing_attribution_event" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_marketing_attribution_event_order_id_unique" ON "marketing_attribution_event" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketing_attribution_event_event_type_occurred_at" ON "marketing_attribution_event" ("event_type", "occurred_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "marketing_attribution_event" add constraint "marketing_attribution_event_subscriber_id_foreign" foreign key ("subscriber_id") references "marketing_subscriber" ("id") on update cascade;`);
    this.addSql(`alter table if exists "marketing_attribution_event" add constraint "marketing_attribution_event_email_event_id_foreign" foreign key ("email_event_id") references "marketing_email_event" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table if exists "marketing_attribution_event" add constraint "marketing_attribution_event_enrollment_id_foreign" foreign key ("enrollment_id") references "marketing_enrollment" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "marketing_attribution_event" cascade;`);
  }

}
