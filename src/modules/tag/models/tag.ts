import { model } from "@medusajs/framework/utils"

export const Tag = model.define("tag", {
  id: model.id().primaryKey(),
  name: model.text(),
  color: model.text().nullable(),
  type: model.enum(["badge", "attribute"]).default("badge"),
})
