import { z } from "zod"

export const PostAdminCreateAttributeTemplate = z.object({
  name: z.string().min(1),
  attributes: z.array(z.string().min(1)).min(1),
})

export const PostAdminUpdateAttributeTemplate = z.object({
  name: z.string().min(1).optional(),
  attributes: z.array(z.string().min(1)).min(1).optional(),
})

export type PostAdminCreateAttributeTemplateType = z.infer<typeof PostAdminCreateAttributeTemplate>
export type PostAdminUpdateAttributeTemplateType = z.infer<typeof PostAdminUpdateAttributeTemplate>
