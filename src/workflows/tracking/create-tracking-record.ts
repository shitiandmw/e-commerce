import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { TRACKING_MODULE } from "../../modules/tracking"
import { buildTrackingUrl } from "../../modules/tracking/carriers"

type CreateTrackingRecordInput = {
  fulfillment_id: string
  tracking_number: string
  carrier: string
  carrier_name: string
  tracking_url?: string
}

const createTrackingRecordStep = createStep(
  "create-tracking-record-step",
  async (input: CreateTrackingRecordInput, { container }) => {
    const trackingService = container.resolve(TRACKING_MODULE)

    const trackingUrl =
      input.tracking_url || buildTrackingUrl(input.carrier, input.tracking_number)

    const record = await trackingService.createTrackingRecords({
      fulfillment_id: input.fulfillment_id,
      tracking_number: input.tracking_number,
      carrier: input.carrier,
      carrier_name: input.carrier_name,
      tracking_url: trackingUrl,
      status: "pending",
    })

    return new StepResponse(record, record.id as string)
  },
  async (id: string, { container }) => {
    if (!id) return
    const trackingService = container.resolve(TRACKING_MODULE)
    await trackingService.deleteTrackingRecords(id)
  }
)

export const createTrackingRecordWorkflow = createWorkflow(
  "create-tracking-record",
  function (input: CreateTrackingRecordInput) {
    const record = createTrackingRecordStep(input)
    return new WorkflowResponse(record)
  }
)
