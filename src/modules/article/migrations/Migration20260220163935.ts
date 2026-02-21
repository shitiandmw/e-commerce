import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260220163935 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "article_category" add column if not exists "parent_id" text null;`);
    this.addSql(`alter table if exists "article_category" add constraint "article_category_parent_id_foreign" foreign key ("parent_id") references "article_category" ("id") on update cascade on delete set null;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_article_category_parent_id" ON "article_category" ("parent_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "article" drop column if exists "translations";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "article_category" drop constraint if exists "article_category_parent_id_foreign";`);

    this.addSql(`drop index if exists "IDX_article_category_parent_id";`);
    this.addSql(`alter table if exists "article_category" drop column if exists "parent_id";`);

    this.addSql(`alter table if exists "article" add column if not exists "translations" jsonb null;`);
  }

}
