import { z } from "zod"

export const PostAdminProductShippingOptions = z.object({
  shipping_option_ids: z.array(z.string().min(1)).min(1),
})

export type PostAdminProductShippingOptionsType = z.infer<
  typeof PostAdminProductShippingOptions
>
