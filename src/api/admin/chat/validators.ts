import { z } from "zod"

export const PostAdminUpdateConversation = z.object({
  status: z.enum(["open", "closed"]).optional(),
  assigned_agent_id: z.string().nullable().optional(),
  unread_count: z.number().optional(),
})

export const PostAdminUpdateChatSettings = z.object({
  welcome_message: z.string().nullable().optional(),
  offline_message: z.string().nullable().optional(),
  business_hours: z.record(z.any()).nullable().optional(),
})

export type PostAdminUpdateConversationType = z.infer<typeof PostAdminUpdateConversation>
export type PostAdminUpdateChatSettingsType = z.infer<typeof PostAdminUpdateChatSettings>
