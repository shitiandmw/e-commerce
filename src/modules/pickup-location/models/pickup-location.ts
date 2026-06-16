import { model } from "@medusajs/framework/utils"

export const PickupLocation = model.define("pickup_location", {
  id: model.id().primaryKey(),
  name: model.text(),
  address: model.text(),
  phone: model.text().nullable(),
  hours: model.text().nullable(),
  note: model.text().nullable(),
  sort_order: model.number().default(0),
  is_enabled: model.boolean().default(true),
})
