import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260209000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "popup" ("id" text not null, "title" text null, "description" text null, "image_url" text null, "button_text" text null, "button_link" text null, "is_enabled" boolean not null default false, "trigger_type" text check ("trigger_type" in ('first_visit', 'every_visit', 'specific_page')) not null default 'first_visit', "display_frequency" text check ("display_frequency" in ('once', 'once_per_session', 'once_per_day')) not null default 'once', "target_page" text null, "sort_order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "popup_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_popup_deleted_at" ON "popup" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "popup" cascade;`);
  }

}
