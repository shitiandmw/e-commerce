import { model } from "@medusajs/framework/utils"
import { BannerItem } from "./banner-item"

export const BannerSlot = model.define("banner_slot", {
  id: model.id().primaryKey(),
  name: model.text(),
  key: model.text(),
  description: model.text().nullable(),
  items: model.hasMany(() => BannerItem, {
    foreignKey: "slot_id",
  }),
})
