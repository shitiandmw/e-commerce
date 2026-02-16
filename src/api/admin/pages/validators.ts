import { z } from "zod"

const SeoSchema = z.object({
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  og_image: z.string().optional(),
  keywords: z.string().optional(),
}).nullable().optional()

const TranslationsSchema = z.record(z.string(), z.object({
  title: z.string().optional(),
  content: z.string().optional(),
})).nullable().optional()

export const PostAdminCreatePage = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  template: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
  translations: TranslationsSchema,
  seo: SeoSchema,
})

export const PostAdminUpdatePage = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  content: z.string().nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
  template: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
  translations: TranslationsSchema,
  seo: SeoSchema,
})

export type PostAdminCreatePageType = z.infer<typeof PostAdminCreatePage>
export type PostAdminUpdatePageType = z.infer<typeof PostAdminUpdatePage>
