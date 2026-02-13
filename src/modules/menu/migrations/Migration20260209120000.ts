import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260209120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "menu" ("id" text not null, "name" text not null, "key" text not null, "description" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "menu_pkey" primary key ("id"));`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_menu_key_unique" ON "menu" ("key") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_menu_deleted_at" ON "menu" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "menu_item" ("id" text not null, "label" text not null, "url" text null, "icon_url" text null, "sort_order" integer not null default 0, "is_enabled" boolean not null default true, "metadata" jsonb null, "parent_id" text null, "menu_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "menu_item_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_menu_item_menu_id" ON "menu_item" ("menu_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_menu_item_parent_id" ON "menu_item" ("parent_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_menu_item_deleted_at" ON "menu_item" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`alter table "menu_item" add constraint "menu_item_menu_id_foreign" foreign key ("menu_id") references "menu" ("id") on update cascade on delete cascade;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "menu_item" cascade;`)
    this.addSql(`drop table if exists "menu" cascade;`)
  }

}
