import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260713030000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "restock_round" ("id" text not null, "variant_id" text not null, "product_id" text not null, "product_title" text not null, "variant_title" text null, "sku" text null, "specification" jsonb null, "status" text check ("status" in ('pending', 'restocked')) not null default 'pending', "restocked_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "restock_round_pkey" primary key ("id"));`)
    this.addSql(`create unique index if not exists "IDX_restock_round_pending_variant" on "restock_round" ("variant_id") where "status" = 'pending' and "deleted_at" is null;`)
    this.addSql(`create index if not exists "IDX_restock_round_status" on "restock_round" ("status") where "deleted_at" is null;`)
    this.addSql(`create index if not exists "IDX_restock_round_deleted_at" on "restock_round" ("deleted_at") where "deleted_at" is null;`)

    this.addSql(`create table if not exists "restock_requester" ("id" text not null, "round_id" text not null, "identity_key" text not null, "customer_id" text null, "visitor_id" text null, "customer_email" text null, "customer_first_name" text null, "customer_last_name" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "restock_requester_pkey" primary key ("id"));`)
    this.addSql(`create unique index if not exists "IDX_restock_requester_round_identity" on "restock_requester" ("round_id", "identity_key") where "deleted_at" is null;`)
    this.addSql(`create index if not exists "IDX_restock_requester_customer" on "restock_requester" ("customer_id") where "deleted_at" is null;`)
    this.addSql(`create index if not exists "IDX_restock_requester_deleted_at" on "restock_requester" ("deleted_at") where "deleted_at" is null;`)
    this.addSql(`alter table "restock_requester" add constraint "restock_requester_round_id_foreign" foreign key ("round_id") references "restock_round" ("id") on update cascade on delete cascade;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "restock_requester" cascade;`)
    this.addSql(`drop table if exists "restock_round" cascade;`)
  }
}
