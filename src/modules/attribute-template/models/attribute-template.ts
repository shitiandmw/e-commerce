import { model } from "@medusajs/framework/utils"

export const AttributeTemplate = model.define("attribute_template", {
  id: model.id().primaryKey(),
  name: model.text(),
  attributes: model.array(),
})
