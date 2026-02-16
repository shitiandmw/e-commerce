import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260216053823 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "collection_tab" add column if not exists "key" text not null default '';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "collection_tab" drop column if exists "key";`);
  }

}
