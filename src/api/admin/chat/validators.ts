import { z } from "zod"

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

export type PostAdminUpdateConversationType = z.infer<typeof PostAdminUpdateConversation>
export type PostAdminUpdateChatSettingsType = z.infer<typeof PostAdminUpdateChatSettings>
