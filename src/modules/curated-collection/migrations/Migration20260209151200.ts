import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260209151200 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "curated_collection" ("id" text not null, "name" text not null, "key" text not null, "description" text null, "sort_order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "curated_collection_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_curated_collection_key_unique" ON "curated_collection" ("key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_curated_collection_deleted_at" ON "curated_collection" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "collection_tab" ("id" text not null, "name" text not null, "sort_order" integer not null default 0, "collection_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "collection_tab_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_collection_tab_collection_id" ON "collection_tab" ("collection_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_collection_tab_deleted_at" ON "collection_tab" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "collection_item" ("id" text not null, "product_id" text not null, "tab_id" text null, "sort_order" integer not null default 0, "collection_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "collection_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_collection_item_collection_id" ON "collection_item" ("collection_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_collection_item_deleted_at" ON "collection_item" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table "collection_tab" add constraint "collection_tab_collection_id_foreign" foreign key ("collection_id") references "curated_collection" ("id") on update cascade;`);
    this.addSql(`alter table "collection_item" add constraint "collection_item_collection_id_foreign" foreign key ("collection_id") references "curated_collection" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "collection_tab" drop constraint if exists "collection_tab_collection_id_foreign";`);
    this.addSql(`alter table "collection_item" drop constraint if exists "collection_item_collection_id_foreign";`);
    this.addSql(`drop table if exists "collection_item" cascade;`);
    this.addSql(`drop table if exists "collection_tab" cascade;`);
    this.addSql(`drop table if exists "curated_collection" cascade;`);
  }

}
