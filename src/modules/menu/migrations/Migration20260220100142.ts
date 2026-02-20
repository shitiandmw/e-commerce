import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260220100142 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "menu_item" add column if not exists "translations" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "menu_item" drop column if exists "translations";`);
  }

}
