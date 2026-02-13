import { Module } from "@medusajs/framework/utils"
import MenuModuleService from "./service"

export const MENU_MODULE = "menu"

export default Module(MENU_MODULE, {
  service: MenuModuleService,
})
