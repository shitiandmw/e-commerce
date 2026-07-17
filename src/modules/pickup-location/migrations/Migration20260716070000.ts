import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260716070000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "pickup_location" add column if not exists "country_code" text null;`)
    this.addSql(`alter table if exists "pickup_location" add column if not exists "city" text null;`)
    this.addSql(`alter table if exists "pickup_location" add column if not exists "province" text null;`)
    this.addSql(`alter table if exists "pickup_location" add column if not exists "postal_code" text null;`)
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "pickup_location" drop column if exists "postal_code";`)
    this.addSql(`alter table if exists "pickup_location" drop column if exists "province";`)
    this.addSql(`alter table if exists "pickup_location" drop column if exists "city";`)
    this.addSql(`alter table if exists "pickup_location" drop column if exists "country_code";`)
  }
}
