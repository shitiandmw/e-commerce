import { model } from "@medusajs/framework/utils"

export const ChatSettings = model.define("chat_settings", {
  id: model.id().primaryKey(),
  welcome_message: model.text().nullable(),
  offline_message: model.text().nullable(),
  business_hours: model.json().nullable(),
  ai_enabled: model.boolean().default(false),
  ai_provider: model.enum(["openai", "anthropic"]).nullable(),
  ai_api_url: model.text().nullable(),
  ai_api_key: model.text().nullable(),
  ai_model: model.text().nullable(),
  ai_system_prompt: model.text().nullable(),
  ai_debounce_seconds: model.number().default(3),
})
