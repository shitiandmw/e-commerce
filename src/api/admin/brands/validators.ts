import { z } from "zod"

export const PostAdminCreateBrand = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  logo_url: z.string().url().optional(),
  origin: z.string().optional(),
})

export const PostAdminUpdateBrand = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  logo_url: z.string().url().optional(),
  origin: z.string().optional(),
})

export type PostAdminCreateBrandType = z.infer<typeof PostAdminCreateBrand>
export type PostAdminUpdateBrandType = z.infer<typeof PostAdminUpdateBrand>
