import { MedusaService } from "@medusajs/framework/utils"
import { Conversation } from "./models/conversation"
import { ChatMessage } from "./models/chat-message"
import { ChatSettings } from "./models/chat-settings"

class ChatModuleService extends MedusaService({
  Conversation,
  ChatMessage,
  ChatSettings,
}) {}

export default ChatModuleService
