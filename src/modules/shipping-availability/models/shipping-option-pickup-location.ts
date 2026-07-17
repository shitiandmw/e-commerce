import { model } from "@medusajs/framework/utils"

export const ShippingOptionPickupLocation = model
  .define("shipping_option_pickup_location", {
    id: model.id({ prefix: "sopl" }).primaryKey(),
    shipping_option_id: model.text(),
    pickup_location_id: model.text(),
  })
  .indexes([
    {
      on: ["shipping_option_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      on: ["pickup_location_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])
