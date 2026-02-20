import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260217132925 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "popup" add column if not exists "popup_type" text check ("popup_type" in ('general', 'coupon')) not null default 'general';`);
    this.addSql(`alter table if exists "popup" add column if not exists "coupon_code" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "popup" drop column if exists "coupon_code";`);
    this.addSql(`alter table if exists "popup" drop column if exists "popup_type";`);
  }

}
