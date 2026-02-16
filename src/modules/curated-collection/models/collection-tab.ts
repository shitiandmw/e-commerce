import { model } from "@medusajs/framework/utils"
import { CuratedCollection } from "./curated-collection"

export const CollectionTab = model.define("collection_tab", {
  id: model.id().primaryKey(),
  name: model.text(),
  key: model.text(),
  sort_order: model.number().default(0),
  collection: model.belongsTo(() => CuratedCollection, {
    mappedBy: "tabs",
  }),
})
