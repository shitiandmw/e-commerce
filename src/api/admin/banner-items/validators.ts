import { z } from "zod"

export const PostAdminCreateBannerItem = z.object({
  slot_id: z.string().min(1),
  image_url: z.string().min(1),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  link_url: z.string().optional(),
  cta_text: z.string().optional(),
  sort_order: z.number().int().optional(),
  is_enabled: z.boolean().optional(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
})

export const PostAdminUpdateBannerItem = z.object({
  slot_id: z.string().min(1).optional(),
  image_url: z.string().min(1).optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  link_url: z.string().optional(),
  cta_text: z.string().optional(),
  sort_order: z.number().int().optional(),
  is_enabled: z.boolean().optional(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
})

export type PostAdminCreateBannerItemType = z.infer<typeof PostAdminCreateBannerItem>
export type PostAdminUpdateBannerItemType = z.infer<typeof PostAdminUpdateBannerItem>
