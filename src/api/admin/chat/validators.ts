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
})

export type PostAdminUpdateConversationType = z.infer<typeof PostAdminUpdateConversation>
export type PostAdminUpdateChatSettingsType = z.infer<typeof PostAdminUpdateChatSettings>
