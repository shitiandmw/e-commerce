import { z } from "zod"

const TranslationsSchema = z.record(z.string(), z.object({
  text: z.string().optional(),
})).nullable().optional()

export const PostAdminCreateAnnouncement = z.object({
  text: z.string().min(1),
  link_url: z.string().url().nullable().optional(),
  sort_order: z.number().int().optional(),
  is_enabled: z.boolean().optional(),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
  translations: TranslationsSchema,
})

export const PostAdminUpdateAnnouncement = z.object({
  text: z.string().min(1).optional(),
  link_url: z.string().url().nullable().optional(),
  sort_order: z.number().int().optional(),
  is_enabled: z.boolean().optional(),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
  translations: TranslationsSchema,
})

export type PostAdminCreateAnnouncementType = z.infer<typeof PostAdminCreateAnnouncement>
export type PostAdminUpdateAnnouncementType = z.infer<typeof PostAdminUpdateAnnouncement>
