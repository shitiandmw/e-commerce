import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { updateTrackingStatusWorkflow } from "../../../../workflows/tracking/update-tracking-status"
import { PostAdminUpdateTrackingStatusType } from "../validators"
import { TRACKING_MODULE } from "../../../../modules/tracking"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const trackingService = req.scope.resolve(TRACKING_MODULE)

  try {
    const record = await trackingService.retrieveTrackingRecord(id, {
      relations: ["events"],
    })

    const sortedEvents = (record.events || []).sort(
      (a: any, b: any) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
    )

    res.json({ tracking_record: { ...record, events: sortedEvents } })
  } catch {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Tracking record ${id} not found`)
  }
}

export const POST = async (
  req: MedusaRequest<PostAdminUpdateTrackingStatusType>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await updateTrackingStatusWorkflow(req.scope).run({
    input: {
      tracking_record_id: id,
      status: req.validatedBody.status,
      events: req.validatedBody.events,
    },
  })

  res.json({ tracking_record: result.record })
}
