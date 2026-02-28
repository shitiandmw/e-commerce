import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260222161754 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "chat_settings" ("id" text not null, "welcome_message" text null, "offline_message" text null, "business_hours" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "chat_settings_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_chat_settings_deleted_at" ON "chat_settings" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "conversation" ("id" text not null, "visitor_id" text null, "customer_id" text null, "assigned_agent_id" text null, "status" text check ("status" in ('open', 'closed')) not null default 'open', "last_message_preview" text null, "last_message_at" timestamptz null, "unread_count" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "conversation_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_conversation_deleted_at" ON "conversation" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "chat_message" ("id" text not null, "conversation_id" text not null, "sender_type" text check ("sender_type" in ('customer', 'visitor', 'agent', 'system')) not null, "sender_id" text not null, "content" text not null, "message_type" text check ("message_type" in ('text', 'image', 'system')) not null default 'text', "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "chat_message_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_chat_message_conversation_id" ON "chat_message" ("conversation_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_chat_message_deleted_at" ON "chat_message" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "chat_message" add constraint "chat_message_conversation_id_foreign" foreign key ("conversation_id") references "conversation" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "chat_message" drop constraint if exists "chat_message_conversation_id_foreign";`);

    this.addSql(`drop table if exists "chat_settings" cascade;`);

    this.addSql(`drop table if exists "conversation" cascade;`);

    this.addSql(`drop table if exists "chat_message" cascade;`);
  }

}
