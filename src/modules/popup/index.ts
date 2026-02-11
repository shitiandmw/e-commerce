import { Module } from "@medusajs/framework/utils"
import PopupModuleService from "./service"

export const POPUP_MODULE = "popup"

export default Module(POPUP_MODULE, {
  service: PopupModuleService,
})
