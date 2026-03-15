import { Migration } from "@mikro-orm/migrations"

export class Migration20260315000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "chat_settings"
      ADD COLUMN IF NOT EXISTS "ai_enabled" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "ai_provider" text,
      ADD COLUMN IF NOT EXISTS "ai_api_url" text,
      ADD COLUMN IF NOT EXISTS "ai_api_key" text,
      ADD COLUMN IF NOT EXISTS "ai_model" text,
      ADD COLUMN IF NOT EXISTS "ai_system_prompt" text,
      ADD COLUMN IF NOT EXISTS "ai_debounce_seconds" integer DEFAULT 3;
    `)

    this.addSql(`
      ALTER TABLE "chat_settings"
      ADD CONSTRAINT "chat_settings_ai_provider_check"
      CHECK ("ai_provider" IS NULL OR "ai_provider" IN ('openai', 'anthropic'));
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "chat_settings"
      DROP CONSTRAINT IF EXISTS "chat_settings_ai_provider_check";
    `)

    this.addSql(`
      ALTER TABLE "chat_settings"
      DROP COLUMN IF EXISTS "ai_enabled",
      DROP COLUMN IF EXISTS "ai_provider",
      DROP COLUMN IF EXISTS "ai_api_url",
      DROP COLUMN IF EXISTS "ai_api_key",
      DROP COLUMN IF EXISTS "ai_model",
      DROP COLUMN IF EXISTS "ai_system_prompt",
      DROP COLUMN IF EXISTS "ai_debounce_seconds";
    `)
  }
}
