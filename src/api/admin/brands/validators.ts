import { z } from "zod"

const TranslationsSchema = z.record(z.string(), z.object({
  name: z.string().optional(),
  description: z.string().optional(),
})).nullable().optional()

export const PostAdminCreateBrand = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  logo_url: z.string().url().optional(),
  translations: TranslationsSchema,
})

export const PostAdminUpdateBrand = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
  translations: TranslationsSchema,
})

export type PostAdminCreateBrandType = z.infer<typeof PostAdminCreateBrand>
export type PostAdminUpdateBrandType = z.infer<typeof PostAdminUpdateBrand>
