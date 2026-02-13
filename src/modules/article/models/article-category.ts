import { model } from "@medusajs/framework/utils"

export const ArticleCategory = model.define("article_category", {
  id: model.id().primaryKey(),
  name: model.text(),
  handle: model.text().unique(),
  description: model.text().nullable(),
  sort_order: model.number().default(0),
  articles: model.hasMany(() => Article, {
    mappedBy: "category",
  }),
})

// Imported after definition to avoid circular dependency issues
import { Article } from "./article"
