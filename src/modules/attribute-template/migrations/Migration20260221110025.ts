import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260221110025 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "attribute_template" ("id" text not null, "name" text not null, "attributes" text[] not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "attribute_template_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_attribute_template_deleted_at" ON "attribute_template" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "attribute_template" cascade;`);
  }

}
