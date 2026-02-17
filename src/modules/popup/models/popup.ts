import { model } from "@medusajs/framework/utils"

export const Popup = model.define("popup", {
  id: model.id().primaryKey(),
  title: model.text().nullable(),
  description: model.text().nullable(),
  image_url: model.text().nullable(),
  button_text: model.text().nullable(),
  button_link: model.text().nullable(),
  is_enabled: model.boolean().default(false),
  trigger_type: model.enum(["first_visit", "every_visit", "specific_page"]).default("first_visit"),
  display_frequency: model.enum(["once", "once_per_session", "once_per_day"]).default("once"),
  target_page: model.text().nullable(),
  sort_order: model.number().default(0),
  popup_type: model.enum(["general", "coupon"]).default("general"),
  coupon_code: model.text().nullable(),
})
