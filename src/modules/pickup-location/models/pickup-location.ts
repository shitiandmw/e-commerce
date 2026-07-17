import { model } from "@medusajs/framework/utils"

export const PickupLocation = model.define("pickup_location", {
  id: model.id().primaryKey(),
  name: model.text(),
  address: model.text(),
  country_code: model.text().nullable(),
  city: model.text().nullable(),
  province: model.text().nullable(),
  postal_code: model.text().nullable(),
  phone: model.text().nullable(),
  hours: model.text().nullable(),
  note: model.text().nullable(),
  sort_order: model.number().default(0),
  is_enabled: model.boolean().default(true),
})
