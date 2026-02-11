import { MedusaService } from "@medusajs/framework/utils"
import { Popup } from "./models/popup"

class PopupModuleService extends MedusaService({
  Popup,
}) {}

export default PopupModuleService
