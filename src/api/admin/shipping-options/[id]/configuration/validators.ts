import { z } from "zod"

const ShippingOptionConfigurationUpdate = z
  .object({
    name: z.string().min(1).optional(),
    data: z.record(z.unknown()).optional(),
    price_type: z.enum(["flat", "calculated"]).optional(),
    provider_id: z.string().min(1).optional(),
    shipping_profile_id: z.string().min(1).optional(),
    prices: z.array(z.record(z.unknown())).optional(),
    metadata: z
      .object({
        type: z.enum(["pickup", "delivery"]),
      })
      .passthrough(),
  })
  .strict()

export const PostAdminShippingOptionConfiguration = z.object({
  shipping_option: ShippingOptionConfigurationUpdate,
  pickup_location_id: z.string().min(1).nullable(),
})

export type PostAdminShippingOptionConfigurationType = z.infer<
  typeof PostAdminShippingOptionConfiguration
>
