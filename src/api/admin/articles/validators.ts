import { z } from "zod"

export const PostAdminCreateArticle = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  cover_image: z.string().optional(),
  summary: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  published_at: z.string().datetime().nullable().optional(),
  sort_order: z.number().optional(),
  is_pinned: z.boolean().optional(),
  category_id: z.string().optional(),
})

export const PostAdminUpdateArticle = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  cover_image: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
  published_at: z.string().datetime().nullable().optional(),
  sort_order: z.number().optional(),
  is_pinned: z.boolean().optional(),
  category_id: z.string().nullable().optional(),
})

export type PostAdminCreateArticleType = z.infer<typeof PostAdminCreateArticle>
export type PostAdminUpdateArticleType = z.infer<typeof PostAdminUpdateArticle>
