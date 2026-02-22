import { z } from "zod"

export const AddWishlistItemSchema = z.object({
  product_id: z.string(),
})

export type AddWishlistItemSchema = z.infer<typeof AddWishlistItemSchema>
