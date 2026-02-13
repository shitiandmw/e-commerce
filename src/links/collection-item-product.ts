import CuratedCollectionModule from "../modules/curated-collection"
import ProductModule from "@medusajs/medusa/product"
import { defineLink } from "@medusajs/framework/utils"

export default defineLink(
  CuratedCollectionModule.linkable.collectionItem,
  ProductModule.linkable.product
)
