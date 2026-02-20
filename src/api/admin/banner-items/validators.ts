import { z } from "zod"

const TranslationsSchema = z.record(z.string(), z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
})).nullable().optional()

export const PostAdminCreateBannerItem = z.object({
  slot_id: z.string().min(1),
  image_url: z.string().url(),
  title: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  link_url: z.string().url().nullable().optional(),
  sort_order: z.number().int().optional(),
  is_enabled: z.boolean().optional(),
  starts_at: z.string().datetime().nullable().optional(),
  ends_at: z.string().datetime().nullable().optional(),
  translations: TranslationsSchema,
})

export const PostAdminUpdateBannerItem = z.object({
  slot_id: z.string().min(1).optional(),
  image_url: z.string().url().optional(),
  title: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  link_url: z.string().url().nullable().optional(),
  sort_order: z.number().int().optional(),
  is_enabled: z.boolean().optional(),
  starts_at: z.string().datetime().nullable().optional(),
  ends_at: z.string().datetime().nullable().optional(),
  translations: TranslationsSchema,
})

export type PostAdminCreateBannerItemType = z.infer<typeof PostAdminCreateBannerItem>
export type PostAdminUpdateBannerItemType = z.infer<typeof PostAdminUpdateBannerItem>
