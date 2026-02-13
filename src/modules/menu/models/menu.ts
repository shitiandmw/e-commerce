import { model } from "@medusajs/framework/utils"

export const Menu = model.define("menu", {
  id: model.id().primaryKey(),
  name: model.text(),
  key: model.text().unique(),
  description: model.text().nullable(),
  items: model.hasMany(() => MenuItem, {
    mappedBy: "menu",
  }),
})

import { MenuItem } from "./menu-item"
