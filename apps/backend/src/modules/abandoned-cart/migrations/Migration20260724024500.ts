import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260724024500 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "abandoned_cart_campaign" add column if not exists "raw_cart_value" jsonb not null default '{"value":"0","precision":20}';`,
    );
    this.addSql(
      `alter table "abandoned_cart_campaign" add column if not exists "raw_free_shipping_remaining" jsonb not null default '{"value":"0","precision":20}';`,
    );
    this.addSql(
      `alter table "abandoned_cart_campaign" add column if not exists "raw_recovered_revenue" jsonb null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "abandoned_cart_campaign" drop column if exists "raw_recovered_revenue";`,
    );
    this.addSql(
      `alter table "abandoned_cart_campaign" drop column if exists "raw_free_shipping_remaining";`,
    );
    this.addSql(
      `alter table "abandoned_cart_campaign" drop column if exists "raw_cart_value";`,
    );
  }
}
