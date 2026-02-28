import { model } from "@medusajs/framework/utils"
import { Conversation } from "./conversation"

export const ChatMessage = model.define("chat_message", {
  id: model.id().primaryKey(),
  conversation: model.belongsTo(() => Conversation, {
    mappedBy: "messages",
  }),
  sender_type: model.enum(["customer", "visitor", "agent", "system"]),
  sender_id: model.text(),
  content: model.text(),
  message_type: model.enum(["text", "image", "system"]).default("text"),
  metadata: model.json().nullable(),
})
