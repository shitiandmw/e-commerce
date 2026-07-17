import { z } from "zod"

export const PostAdminShippingOptionPickupLocation = z.object({
  pickup_location_id: z.string().min(1).nullable(),
})

export type PostAdminShippingOptionPickupLocationType = z.infer<
  typeof PostAdminShippingOptionPickupLocation
>
