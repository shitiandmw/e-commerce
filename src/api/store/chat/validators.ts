import { z } from "zod"
import { CHAT_TEXT_MAX_LENGTH } from "../../../lib/chat-message"

export const PostStoreCreateConversation = z.object({
  visitor_id: z.string().min(8).max(200).optional(),
  conversation_token: z.string().min(1).max(4000).optional(),
})

export const PostStoreSendChatMessage = z.object({
  content: z.string().trim().min(1).max(CHAT_TEXT_MAX_LENGTH),
})

export type PostStoreCreateConversationType = z.infer<typeof PostStoreCreateConversation>
export type PostStoreSendChatMessageType = z.infer<typeof PostStoreSendChatMessage>
