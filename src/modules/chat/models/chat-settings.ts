import { model } from "@medusajs/framework/utils"

export const ChatSettings = model.define("chat_settings", {
  id: model.id().primaryKey(),
  welcome_message: model.text().nullable(),
  offline_message: model.text().nullable(),
  business_hours: model.json().nullable(),
})
