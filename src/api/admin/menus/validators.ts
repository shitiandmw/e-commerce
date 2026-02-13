import { z } from "zod"

export const PostAdminCreateMenu = z.object({
  name: z.string().min(1),
  key: z.string().min(1),
  description: z.string().optional(),
})

export const PostAdminUpdateMenu = z.object({
  name: z.string().min(1).optional(),
  key: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
})

export type PostAdminCreateMenuType = z.infer<typeof PostAdminCreateMenu>
export type PostAdminUpdateMenuType = z.infer<typeof PostAdminUpdateMenu>
