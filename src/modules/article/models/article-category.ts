import { model } from "@medusajs/framework/utils"

export const ArticleCategory = model.define("article_category", {
  id: model.id().primaryKey(),
  name: model.text().translatable(),
  handle: model.text().unique(),
  description: model.text().translatable().nullable(),
  sort_order: model.number().default(0),
  parent: model.belongsTo(() => ArticleCategory, { mappedBy: "children" }).nullable(),
  children: model.hasMany(() => ArticleCategory, { mappedBy: "parent" }),
  articles: model.hasMany(() => Article, {
    mappedBy: "category",
  }),
})

// Imported after definition to avoid circular dependency issues
import { Article } from "./article"
