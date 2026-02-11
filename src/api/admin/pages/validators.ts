import { z } from "zod"

export const PostAdminCreatePage = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  template: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
})

export const PostAdminUpdatePage = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  content: z.string().nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
  template: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
})

export type PostAdminCreatePageType = z.infer<typeof PostAdminCreatePage>
export type PostAdminUpdatePageType = z.infer<typeof PostAdminUpdatePage>
