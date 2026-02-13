import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260209000001 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "banner_slot" ("id" text not null, "name" text not null, "key" text not null, "description" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "banner_slot_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_banner_slot_key_unique" ON "banner_slot" ("key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_banner_slot_deleted_at" ON "banner_slot" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "banner_item" ("id" text not null, "slot_id" text not null, "image_url" text not null, "title" text null, "subtitle" text null, "link_url" text null, "sort_order" integer not null default 0, "is_enabled" boolean not null default true, "starts_at" timestamptz null, "ends_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "banner_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_banner_item_slot_id" ON "banner_item" ("slot_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_banner_item_deleted_at" ON "banner_item" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table "banner_item" add constraint "banner_item_slot_id_foreign" foreign key ("slot_id") references "banner_slot" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "banner_item" cascade;`);
    this.addSql(`drop table if exists "banner_slot" cascade;`);
  }

}
