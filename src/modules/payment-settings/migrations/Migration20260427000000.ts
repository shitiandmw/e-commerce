import { Migration } from "@mikro-orm/migrations"

export class Migration20260427000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "payment_provider_settings" (
        "id" text NOT NULL,
        "provider_id" text NOT NULL,
        "is_enabled" boolean NOT NULL DEFAULT true,
        "display_name" text,
        "description" text,
        "sandbox_mode" boolean NOT NULL DEFAULT true,
        "api_key" text,
        "webhook_secret" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "payment_provider_settings_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "payment_provider_settings_provider_id_unique" UNIQUE ("provider_id")
      );

      INSERT INTO "payment_provider_settings" ("id", "provider_id", "is_enabled", "display_name", "description", "sandbox_mode")
      VALUES
        (gen_random_uuid(), 'pp_system_default', true, 'Direct Order', 'Place order without online payment.', false),
        (gen_random_uuid(), 'pp_stripe_stripe', true, 'Credit / Debit Card', 'Pay securely with Stripe.', false),
        (gen_random_uuid(), 'pp_wooshpay_wooshpay', false, 'WooShPay', 'Pay via WooShPay.', true)
      ON CONFLICT ("provider_id") DO NOTHING;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "payment_provider_settings";`)
  }
}
