import { MedusaService } from "@medusajs/framework/utils"
import { Tag } from "./models/tag"

class TagModuleService extends MedusaService({
  CustomTag: Tag,
}) {}

export default TagModuleService
