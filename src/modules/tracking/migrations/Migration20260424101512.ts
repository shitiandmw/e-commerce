import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260424101512 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "tracking_record" ("id" text not null, "tracking_number" text not null, "carrier" text not null, "carrier_name" text not null, "status" text check ("status" in ('pending', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'expired')) not null default 'pending', "tracking_url" text null, "last_synced_at" timestamptz null, "estimated_delivery" timestamptz null, "raw_data" jsonb null, "fulfillment_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "tracking_record_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tracking_record_deleted_at" ON "tracking_record" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "tracking_event" ("id" text not null, "tracking_record_id" text not null, "status" text not null, "description" text not null, "location" text null, "occurred_at" timestamptz not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "tracking_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tracking_event_tracking_record_id" ON "tracking_event" ("tracking_record_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tracking_event_deleted_at" ON "tracking_event" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "tracking_event" add constraint "tracking_event_tracking_record_id_foreign" foreign key ("tracking_record_id") references "tracking_record" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "tracking_event" drop constraint if exists "tracking_event_tracking_record_id_foreign";`);

    this.addSql(`drop table if exists "tracking_record" cascade;`);

    this.addSql(`drop table if exists "tracking_event" cascade;`);
  }

}
