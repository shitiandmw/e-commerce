import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260722010000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "restock_round" drop constraint if exists "restock_round_status_check";`)
    this.addSql(`alter table "restock_round" add constraint "restock_round_status_check" check ("status" in ('pending', 'restocked', 'discontinued'));`)
  }

  override async down(): Promise<void> {
    this.addSql(`update "restock_round" set "status" = 'restocked' where "status" = 'discontinued';`)
    this.addSql(`alter table "restock_round" drop constraint if exists "restock_round_status_check";`)
    this.addSql(`alter table "restock_round" add constraint "restock_round_status_check" check ("status" in ('pending', 'restocked'));`)
  }
}
