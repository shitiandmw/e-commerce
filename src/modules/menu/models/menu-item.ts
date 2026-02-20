import { model } from "@medusajs/framework/utils"
import { Menu } from "./menu"

export const MenuItem = model.define("menu_item", {
  id: model.id().primaryKey(),
  label: model.text().translatable(),
  url: model.text().nullable(),
  icon_url: model.text().nullable(),
  sort_order: model.number().default(0),
  is_enabled: model.boolean().default(true),
  metadata: model.json().nullable(),
  translations: model.json().nullable(),
  parent_id: model.text().nullable(),
  menu: model.belongsTo(() => Menu, {
    mappedBy: "items",
  }),
})
