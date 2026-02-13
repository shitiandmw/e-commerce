import { z } from "zod"

export const PostAdminCreateBannerSlot = z.object({
  name: z.string().min(1),
  key: z.string().min(1),
  description: z.string().optional(),
})

export const PostAdminUpdateBannerSlot = z.object({
  name: z.string().min(1).optional(),
  key: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
})

export type PostAdminCreateBannerSlotType = z.infer<typeof PostAdminCreateBannerSlot>
export type PostAdminUpdateBannerSlotType = z.infer<typeof PostAdminUpdateBannerSlot>
