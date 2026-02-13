import { MedusaService } from "@medusajs/framework/utils"
import { BannerSlot } from "./models/banner-slot"
import { BannerItem } from "./models/banner-item"

class BannerModuleService extends MedusaService({
  BannerSlot,
  BannerItem,
}) {}

export default BannerModuleService
