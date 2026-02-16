import { model } from "@medusajs/framework/utils"

export const Page = model.define("page", {
  id: model.id().primaryKey(),
  title: model.text(),
  slug: model.text(),
  content: model.text().nullable(),
  status: model.enum(["draft", "published"]).default("draft"),
  template: model.text().nullable(),
  sort_order: model.number().default(0),
  translations: model.json().nullable(),
  seo: model.json().nullable(),
})
