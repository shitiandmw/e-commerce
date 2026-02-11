import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260209100000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "page" ("id" text not null, "title" text not null, "slug" text not null, "content" text null, "status" text check ("status" in ('draft', 'published')) not null default 'draft', "template" text null, "sort_order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "page_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_page_slug_unique" ON "page" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_page_deleted_at" ON "page" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_page_status" ON "page" ("status") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "page" cascade;`);
  }

}
