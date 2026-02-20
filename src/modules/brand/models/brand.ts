import { model } from "@medusajs/framework/utils"

export const Brand = model.define("brand", {
  id: model.id().primaryKey(),
  name: model.text().translatable(),
  description: model.text().translatable().nullable(),
  logo_url: model.text().nullable(),
  translations: model.json().nullable(),
})
