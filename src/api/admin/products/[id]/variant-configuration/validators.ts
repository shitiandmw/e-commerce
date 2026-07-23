import { z } from "zod"

const OptionValue = z.object({
  key: z.string().min(1),
  id: z.string().min(1).optional(),
  value: z.string().trim().min(1),
})

const ProductOption = z.object({
  key: z.string().min(1),
  id: z.string().min(1).optional(),
  title: z.string().trim().min(1),
  values: z.array(OptionValue).min(1),
})

const ProductVariant = z.object({
  key: z.string().min(1),
  id: z.string().min(1).optional(),
  title: z.string().trim().min(1),
  sku: z.string().trim().min(1),
  prices: z.array(z.object({
    amount: z.number().int().min(0),
    currency_code: z.string().trim().length(3).transform((value) => value.toLowerCase()),
  })).min(1),
  manage_inventory: z.boolean(),
  option_values: z.record(z.string().min(1), z.string().min(1)),
  status: z.enum(["active", "stopped", "delete"]),
})

export const PostAdminProductVariantConfiguration = z.object({
  expected_updated_at: z.string().datetime().optional(),
  options: z.array(ProductOption).min(1),
  variants: z.array(ProductVariant).min(1),
})

export type PostAdminProductVariantConfigurationType = z.infer<
  typeof PostAdminProductVariantConfiguration
>
