import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260716040000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "product_shipping_option" (
        "id" text not null,
        "product_id" text not null,
        "shipping_option_id" text not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "product_shipping_option_pkey" primary key ("id")
      );
    `)
    this.addSql(`create unique index if not exists "IDX_product_shipping_option_unique" on "product_shipping_option" ("product_id", "shipping_option_id") where "deleted_at" is null;`)
    this.addSql(`create index if not exists "IDX_product_shipping_option_option" on "product_shipping_option" ("shipping_option_id") where "deleted_at" is null;`)
    this.addSql(`create index if not exists "IDX_product_shipping_option_deleted_at" on "product_shipping_option" ("deleted_at") where "deleted_at" is null;`)

    this.addSql(`
      create table if not exists "shipping_option_pickup_location" (
        "id" text not null,
        "shipping_option_id" text not null,
        "pickup_location_id" text not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "shipping_option_pickup_location_pkey" primary key ("id")
      );
    `)
    this.addSql(`create unique index if not exists "IDX_shipping_option_pickup_option_unique" on "shipping_option_pickup_location" ("shipping_option_id") where "deleted_at" is null;`)
    this.addSql(`create unique index if not exists "IDX_shipping_option_pickup_location_unique" on "shipping_option_pickup_location" ("pickup_location_id") where "deleted_at" is null;`)
    this.addSql(`create index if not exists "IDX_shipping_option_pickup_deleted_at" on "shipping_option_pickup_location" ("deleted_at") where "deleted_at" is null;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "shipping_option_pickup_location" cascade;`)
    this.addSql(`drop table if exists "product_shipping_option" cascade;`)
  }
}
