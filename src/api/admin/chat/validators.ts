import { z } from "zod"
import {
  CHAT_IMAGE_MAX_BYTES,
  CHAT_IMAGE_MIME_TYPES,
  CHAT_TEXT_MAX_LENGTH,
} from "../../../lib/chat-message"

export const PostAdminUpdateConversation = z.object({
  status: z.enum(["open", "closed"]).optional(),
  assigned_agent_id: z.string().optional(),
  unread_count: z.number().optional(),
})

export const PostAdminUpdateChatSettings = z.object({
  welcome_message: z.string().optional(),
  offline_message: z.string().optional(),
  business_hours: z.record(z.any()).optional(),
  ai_enabled: z.boolean().optional(),
  ai_provider: z.enum(["openai", "anthropic"]).optional(),
  ai_api_url: z.string().optional(),
  ai_api_key: z.string().optional(),
  ai_model: z.string().optional(),
  ai_system_prompt: z.string().optional(),
  ai_debounce_seconds: z.number().min(1).max(60).optional(),
})

const ChatImageMetadata = z.object({
  file_id: z.string().min(1).max(500),
  file_name: z.string().min(1).max(500),
  mime_type: z.enum(CHAT_IMAGE_MIME_TYPES),
  size: z.number().int().positive().max(CHAT_IMAGE_MAX_BYTES),
})

export const PostAdminSendChatMessage = z.object({
  message_type: z.enum(["text", "image"]).default("text"),
  content: z.string().trim().min(1).max(CHAT_TEXT_MAX_LENGTH),
  metadata: ChatImageMetadata.optional(),
}).superRefine((value, context) => {
  if (value.message_type !== "image") return

  if (!value.metadata) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["metadata"],
      message: "Image metadata is required",
    })
  }

  try {
    new URL(value.content)
  } catch {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["content"],
      message: "Image content must be a valid URL",
    })
  }
})

export type PostAdminUpdateConversationType = z.infer<typeof PostAdminUpdateConversation>
export type PostAdminUpdateChatSettingsType = z.infer<typeof PostAdminUpdateChatSettings>
export type PostAdminSendChatMessageType = z.infer<typeof PostAdminSendChatMessage>
