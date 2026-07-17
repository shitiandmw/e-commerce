import { model } from "@medusajs/framework/utils"

export const ProductShippingOption = model
  .define("product_shipping_option", {
    id: model.id({ prefix: "pso" }).primaryKey(),
    product_id: model.text(),
    shipping_option_id: model.text(),
  })
  .indexes([
    {
      on: ["product_id", "shipping_option_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      on: ["shipping_option_id"],
      where: "deleted_at IS NULL",
    },
  ])
