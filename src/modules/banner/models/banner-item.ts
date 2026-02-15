import { model } from "@medusajs/framework/utils"
import { BannerSlot } from "./banner-slot"

export const BannerItem = model.define("banner_item", {
  id: model.id().primaryKey(),
  slot: model.belongsTo(() => BannerSlot, {
    foreignKey: "slot_id",
  }),
  image_url: model.text(),
  title: model.text().nullable(),
  subtitle: model.text().nullable(),
  link_url: model.text().nullable(),
  sort_order: model.number().default(0),
  is_enabled: model.boolean().default(true),
  starts_at: model.dateTime().nullable(),
  ends_at: model.dateTime().nullable(),
})
