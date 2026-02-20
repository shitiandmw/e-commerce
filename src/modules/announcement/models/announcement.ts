import { model } from "@medusajs/framework/utils"

export const Announcement = model.define("announcement", {
  id: model.id().primaryKey(),
  text: model.text().translatable(),
  link_url: model.text().nullable(),
  sort_order: model.number().default(0),
  is_enabled: model.boolean().default(true),
  starts_at: model.dateTime().nullable(),
  ends_at: model.dateTime().nullable(),
})
