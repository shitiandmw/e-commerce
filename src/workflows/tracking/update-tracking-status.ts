import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { TRACKING_MODULE } from "../../modules/tracking"

type TrackingEventInput = {
  status: string
  description: string
  location?: string
  occurred_at: string
}

type UpdateTrackingStatusInput = {
  tracking_record_id: string
  status?: string
  events?: TrackingEventInput[]
  raw_data?: Record<string, unknown>
}

const updateTrackingRecordStep = createStep(
  "update-tracking-record-step",
  async (input: { id: string; status?: string; raw_data?: Record<string, unknown> }, { container }) => {
    const trackingService = container.resolve(TRACKING_MODULE)

    const existing = await trackingService.retrieveTrackingRecord(input.id)

    const updateData: Record<string, unknown> = {
      id: input.id,
      last_synced_at: new Date(),
    }
    if (input.status) updateData.status = input.status
    if (input.raw_data) updateData.raw_data = input.raw_data

    const updated = await trackingService.updateTrackingRecords(updateData)

    return new StepResponse(updated, { id: input.id, previousStatus: existing.status })
  },
  async (compensationData, { container }) => {
    if (!compensationData) return
    const trackingService = container.resolve(TRACKING_MODULE)
    await trackingService.updateTrackingRecords({
      id: compensationData.id,
      status: compensationData.previousStatus,
    })
  }
)

const createTrackingEventsStep = createStep(
  "create-tracking-events-step",
  async (input: { tracking_record_id: string; events: TrackingEventInput[] }, { container }) => {
    const trackingService = container.resolve(TRACKING_MODULE)

    if (!input.events || input.events.length === 0) {
      return new StepResponse([], [])
    }

    const created = await trackingService.createTrackingEvents(
      input.events.map((e) => ({
        tracking_record_id: input.tracking_record_id,
        status: e.status,
        description: e.description,
        location: e.location || null,
        occurred_at: new Date(e.occurred_at),
      }))
    )

    const createdArr = Array.isArray(created) ? created : [created]
    const ids = createdArr.map((c: any) => c.id as string)
    return new StepResponse(created, ids)
  },
  async (ids, { container }) => {
    if (!ids || ids.length === 0) return
    const trackingService = container.resolve(TRACKING_MODULE)
    await trackingService.deleteTrackingEvents(ids)
  }
)

export const updateTrackingStatusWorkflow = createWorkflow(
  "update-tracking-status",
  function (input: UpdateTrackingStatusInput) {
    const updateInput = transform({ input }, ({ input }) => ({
      id: input.tracking_record_id,
      status: input.status,
      raw_data: input.raw_data,
    }))

    const record = updateTrackingRecordStep(updateInput)

    const eventsInput = transform({ input }, ({ input }) => ({
      tracking_record_id: input.tracking_record_id,
      events: input.events || [],
    }))

    const events = createTrackingEventsStep(eventsInput)

    const result = transform({ record, events }, ({ record, events }) => ({
      record,
      events,
    }))

    return new WorkflowResponse(result)
  }
)
