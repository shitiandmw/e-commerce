import { MedusaService } from "@medusajs/framework/utils"
import { AttributeTemplate } from "./models/attribute-template"

class AttributeTemplateModuleService extends MedusaService({
  AttributeTemplate,
}) {}

export default AttributeTemplateModuleService
