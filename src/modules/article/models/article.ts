import { model } from "@medusajs/framework/utils"
import { ArticleCategory } from "./article-category"

export const Article = model.define("article", {
  id: model.id().primaryKey(),
  title: model.text().translatable(),
  slug: model.text().unique(),
  cover_image: model.text().nullable(),
  summary: model.text().translatable().nullable(),
  content: model.text().translatable().nullable(),
  status: model.enum(["draft", "published"]).default("draft"),
  published_at: model.dateTime().nullable(),
  sort_order: model.number().default(0),
  is_pinned: model.boolean().default(false),
  seo: model.json().nullable(),
  category: model.belongsTo(() => ArticleCategory, {
    mappedBy: "articles",
  }).nullable(),
})
