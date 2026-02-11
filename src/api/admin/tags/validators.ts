import { z } from "zod"

export const PostAdminCreateTag = z.object({
  name: z.string().min(1),
  color: z.string().nullable().optional(),
  type: z.enum(["badge", "attribute"]).default("badge"),
})

export const PostAdminUpdateTag = z.object({
  name: z.string().min(1).optional(),
  color: z.string().nullable().optional(),
  type: z.enum(["badge", "attribute"]).optional(),
})

export const PostAdminLinkProductTag = z.object({
  product_id: z.string().min(1),
})

export type PostAdminCreateTagType = z.infer<typeof PostAdminCreateTag>
export type PostAdminUpdateTagType = z.infer<typeof PostAdminUpdateTag>
export type PostAdminLinkProductTagType = z.infer<typeof PostAdminLinkProductTag>
