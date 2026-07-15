import { MedusaService } from "@medusajs/framework/utils"
import { RestockRound } from "./models/restock-round"
import { RestockRequester } from "./models/restock-requester"

class RestockDemandModuleService extends MedusaService({
  RestockRound,
  RestockRequester,
}) {}

export default RestockDemandModuleService
