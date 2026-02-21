import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260209100001 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "article_category" ("id" text not null, "name" text not null, "handle" text not null, "description" text null, "sort_order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "article_category_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_article_category_handle_unique" ON "article_category" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_article_category_deleted_at" ON "article_category" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "article" ("id" text not null, "title" text not null, "slug" text not null, "cover_image" text null, "summary" text null, "content" text null, "status" text check ("status" in ('draft', 'published')) not null default 'draft', "published_at" timestamptz null, "sort_order" integer not null default 0, "is_pinned" boolean not null default false, "category_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "article_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_article_slug_unique" ON "article" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_article_deleted_at" ON "article" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_article_category_id" ON "article" ("category_id");`);
    this.addSql(`alter table "article" add constraint "article_category_id_foreign" foreign key ("category_id") references "article_category" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "article" drop constraint if exists "article_category_id_foreign";`);
    this.addSql(`drop table if exists "article" cascade;`);
    this.addSql(`drop table if exists "article_category" cascade;`);
  }

}
