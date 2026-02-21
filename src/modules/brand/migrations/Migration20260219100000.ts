import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260219100000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "brand" ADD COLUMN IF NOT EXISTS "origin" text;`);
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "brand" DROP COLUMN IF EXISTS "origin";`);
  }

}
