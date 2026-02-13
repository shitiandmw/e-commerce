import { model } from "@medusajs/framework/utils"
import { CuratedCollection } from "./curated-collection"

export const CollectionItem = model.define("collection_item", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  tab_id: model.text().nullable(),
  sort_order: model.number().default(0),
  collection: model.belongsTo(() => CuratedCollection, {
    mappedBy: "items",
  }),
})
