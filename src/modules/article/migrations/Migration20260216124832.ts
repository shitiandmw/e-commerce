import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260216124832 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "article" add column if not exists "translations" jsonb null;`);
    this.addSql(`alter table if exists "article" add column if not exists "seo" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "article" drop column if exists "translations";`);
    this.addSql(`alter table if exists "article" drop column if exists "seo";`);
  }

}
