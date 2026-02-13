import { Module } from "@medusajs/framework/utils"
import CuratedCollectionModuleService from "./service"

export const CURATED_COLLECTION_MODULE = "curatedCollection"

export default Module(CURATED_COLLECTION_MODULE, {
  service: CuratedCollectionModuleService,
})
