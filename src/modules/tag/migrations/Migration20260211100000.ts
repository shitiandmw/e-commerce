import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260211100000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE IF EXISTS "tag" RENAME TO "custom_tag";`);
    this.addSql(`ALTER INDEX IF EXISTS "tag_pkey" RENAME TO "custom_tag_pkey";`);
    this.addSql(`ALTER INDEX IF EXISTS "IDX_tag_deleted_at" RENAME TO "IDX_custom_tag_deleted_at";`);
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE IF EXISTS "custom_tag" RENAME TO "tag";`);
    this.addSql(`ALTER INDEX IF EXISTS "custom_tag_pkey" RENAME TO "tag_pkey";`);
    this.addSql(`ALTER INDEX IF EXISTS "IDX_custom_tag_deleted_at" RENAME TO "IDX_tag_deleted_at";`);
  }

}
