import { z } from "zod"

export const PostAdminCreateArticleCategory = z.object({
  name: z.string().min(1),
  handle: z.string().min(1),
  description: z.string().optional(),
  sort_order: z.number().optional(),
  parent_id: z.string().nullable().optional(),
})

export const PostAdminUpdateArticleCategory = z.object({
  name: z.string().min(1).optional(),
  handle: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  sort_order: z.number().optional(),
  parent_id: z.string().nullable().optional(),
})

export type PostAdminCreateArticleCategoryType = z.infer<typeof PostAdminCreateArticleCategory>
export type PostAdminUpdateArticleCategoryType = z.infer<typeof PostAdminUpdateArticleCategory>
