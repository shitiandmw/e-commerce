import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260216040254 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "custom_tag" ("id" text not null, "name" text not null, "color" text null, "type" text check ("type" in ('badge', 'attribute')) not null default 'badge', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "custom_tag_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_custom_tag_deleted_at" ON "custom_tag" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "custom_tag" cascade;`);
  }

}
