import { MedusaService } from "@medusajs/framework/utils"
import { CuratedCollection } from "./models/curated-collection"
import { CollectionTab } from "./models/collection-tab"
import { CollectionItem } from "./models/collection-item"

class CuratedCollectionModuleService extends MedusaService({
  CuratedCollection,
  CollectionTab,
  CollectionItem,
}) {}

export default CuratedCollectionModuleService
