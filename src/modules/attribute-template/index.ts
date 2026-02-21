import { Module } from "@medusajs/framework/utils"
import AttributeTemplateModuleService from "./service"

export const ATTRIBUTE_TEMPLATE_MODULE = "attribute_template"

export default Module(ATTRIBUTE_TEMPLATE_MODULE, {
  service: AttributeTemplateModuleService,
})
