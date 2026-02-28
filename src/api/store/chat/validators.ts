import { z } from "zod"

export const PostStoreCreateConversation = z.object({
  visitor_id: z.string().uuid().optional(),
})

export type PostStoreCreateConversationType = z.infer<typeof PostStoreCreateConversation>
