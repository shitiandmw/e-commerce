import { MedusaService } from "@medusajs/framework/utils"
import WishlistItem from "./models/WishlistItem"

class WishlistModuleService extends MedusaService({
  WishlistItem,
}) {}

export default WishlistModuleService
