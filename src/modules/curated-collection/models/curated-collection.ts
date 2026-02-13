import { model } from "@medusajs/framework/utils"

export const CuratedCollection = model.define("curated_collection", {
  id: model.id().primaryKey(),
  name: model.text(),
  key: model.text().unique(),
  description: model.text().nullable(),
  sort_order: model.number().default(0),
  tabs: model.hasMany(() => CollectionTab, {
    mappedBy: "collection",
  }),
  items: model.hasMany(() => CollectionItem, {
    mappedBy: "collection",
  }),
})

import { CollectionTab } from "./collection-tab"
import { CollectionItem } from "./collection-item"
