import { Module } from "@medusajs/framework/utils"
import ShippingAvailabilityModuleService from "./service"

export const SHIPPING_AVAILABILITY_MODULE = "shipping_availability"

export default Module(SHIPPING_AVAILABILITY_MODULE, {
  service: ShippingAvailabilityModuleService,
})
