import { z } from "zod"

const SeoSchema = z.object({
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  og_image: z.string().optional(),
  keywords: z.string().optional(),
}).optional()

export const PostAdminCreateArticle = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  cover_image: z.string().optional(),
  summary: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  published_at: z.string().datetime().optional(),
  sort_order: z.number().optional(),
  is_pinned: z.boolean().optional(),
  category_id: z.string().optional(),
  seo: SeoSchema,
})

export const PostAdminUpdateArticle = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  cover_image: z.string().optional(),
  summary: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  published_at: z.string().datetime().optional(),
  sort_order: z.number().optional(),
  is_pinned: z.boolean().optional(),
  category_id: z.string().optional(),
  seo: SeoSchema,
})

export type PostAdminCreateArticleType = z.infer<typeof PostAdminCreateArticle>
export type PostAdminUpdateArticleType = z.infer<typeof PostAdminUpdateArticle>
