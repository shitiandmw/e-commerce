import { z } from "zod"

export const PostStoreRemoveIncompatibleItems = z.object({
  shipping_option_id: z.string().trim().min(1),
  line_item_ids: z.array(z.string().trim().min(1)).min(1),
})

export type PostStoreRemoveIncompatibleItemsType = z.infer<
  typeof PostStoreRemoveIncompatibleItems
>
