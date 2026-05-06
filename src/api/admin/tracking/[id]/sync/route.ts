import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { syncTrackingWorkflow } from "../../../../../workflows/tracking/sync-tracking"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params

  const { result } = await syncTrackingWorkflow(req.scope).run({
    input: { tracking_record_id: id },
  })

  res.json({
    message: "Sync triggered (provider integration pending)",
    tracking_record_id: result.trackingRecordId,
  })
}
