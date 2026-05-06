import { MedusaService } from "@medusajs/framework/utils"
import { TrackingRecord, TrackingEvent } from "./models/tracking-record"

class TrackingModuleService extends MedusaService({
  TrackingRecord,
  TrackingEvent,
}) {}

export default TrackingModuleService
