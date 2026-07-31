import { z } from "zod"

export const PostAdminProductSalePrices = z.object({
  configurations: z.array(z.object({
    variant_id: z.string().min(1),
    enabled: z.boolean(),
    mode: z.enum(["ongoing", "scheduled"]),
    amount: z.number().int().positive().nullable(),
    currency_code: z.string().trim().length(3).transform((value) =>
      value.toLowerCase()
    ),
    starts_at: z.string().datetime().nullable(),
    ends_at: z.string().datetime().nullable(),
  })),
})

export type PostAdminProductSalePricesType = z.infer<
  typeof PostAdminProductSalePrices
>
