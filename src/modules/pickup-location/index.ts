import { Module } from "@medusajs/framework/utils"
import PickupLocationModuleService from "./service"

export const PICKUP_LOCATION_MODULE = "pickup_location"

export default Module(PICKUP_LOCATION_MODULE, {
  service: PickupLocationModuleService,
})
