import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260615000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "pickup_location" (
        "id" text NOT NULL,
        "name" text NOT NULL,
        "address" text NOT NULL,
        "phone" text NULL,
        "hours" text NULL,
        "note" text NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_enabled" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "pickup_location_pkey" PRIMARY KEY ("id")
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pickup_location_deleted_at" ON "pickup_location" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pickup_location_enabled_sort" ON "pickup_location" ("is_enabled", "sort_order") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "pickup_location" CASCADE;`)
  }
}
