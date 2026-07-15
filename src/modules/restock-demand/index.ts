import { Module } from "@medusajs/framework/utils"
import RestockDemandModuleService from "./service"

export const RESTOCK_DEMAND_MODULE = "restockDemand"

export default Module(RESTOCK_DEMAND_MODULE, {
  service: RestockDemandModuleService,
})
