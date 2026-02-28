import { model } from "@medusajs/framework/utils"
import { ChatMessage } from "./chat-message"

export const Conversation = model.define("conversation", {
  id: model.id().primaryKey(),
  visitor_id: model.text().nullable(),
  customer_id: model.text().nullable(),
  assigned_agent_id: model.text().nullable(),
  status: model.enum(["open", "closed"]).default("open"),
  last_message_preview: model.text().nullable(),
  last_message_at: model.dateTime().nullable(),
  unread_count: model.number().default(0),
  messages: model.hasMany(() => ChatMessage, {
    mappedBy: "conversation",
  }),
})
