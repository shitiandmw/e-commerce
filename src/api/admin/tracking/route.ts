import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createTrackingRecordWorkflow } from "../../../workflows/tracking/create-tracking-record"
import { PostAdminCreateTrackingRecordType } from "./validators"
import { TRACKING_MODULE } from "../../../modules/tracking"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const trackingService = req.scope.resolve(TRACKING_MODULE)

  const fulfillmentId = req.query.fulfillment_id as string | undefined
  const status = req.query.status as string | undefined
  const limit = parseInt(req.query.limit as string) || 20
  const offset = parseInt(req.query.offset as string) || 0

  const filters: Record<string, any> = {}
  if (fulfillmentId) filters.fulfillment_id = fulfillmentId
  if (status) filters.status = status

  const [records, count] = await trackingService.listAndCountTrackingRecords(
    filters,
    {
      take: limit,
      skip: offset,
      order: { created_at: "DESC" },
      relations: ["events"],
    }
  )

  res.json({ tracking_records: records, count, offset, limit })
}

export const POST = async (
  req: MedusaRequest<PostAdminCreateTrackingRecordType>,
  res: MedusaResponse
) => {
  const { result } = await createTrackingRecordWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.json({ tracking_record: result })
}
