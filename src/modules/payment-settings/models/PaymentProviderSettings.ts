import { model } from "@medusajs/framework/utils"

export const PaymentProviderSettings = model.define("payment_provider_settings", {
  id: model.id().primaryKey(),
  provider_id: model.text().unique(),
  is_enabled: model.boolean().default(true),
  display_name: model.text().nullable(),
  description: model.text().nullable(),
  sandbox_mode: model.boolean().default(true),
  api_key: model.text().nullable(),
  webhook_secret: model.text().nullable(),
  metadata: model.json().nullable(),
})
