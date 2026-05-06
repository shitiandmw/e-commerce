import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { TRACKING_MODULE } from "../../modules/tracking"
import { updateTrackingStatusWorkflow } from "./update-tracking-status"

type SyncTrackingInput = {
  tracking_record_id: string
}

/**
 * Placeholder step for fetching tracking info from an external provider.
 * Replace this implementation when integrating with a real carrier API
 * (e.g., AfterShip, Hong Kong Post API).
 *
 * Expected return format: { status, events[] }
 */
const fetchTrackingFromProviderStep = createStep(
  "fetch-tracking-from-provider-step",
  async (input: { tracking_record_id: string; tracking_number: string; carrier: string }, { container }) => {
    const logger = container.resolve("logger")
    logger.info(
      `[tracking-sync] Placeholder: would fetch tracking for ${input.carrier}/${input.tracking_number}. ` +
      `Implement carrier API integration to enable real tracking sync.`
    )

    // TODO: Replace with actual API call
    // const response = await carrierApiClient.getTracking(input.tracking_number)
    // return new StepResponse({
    //   status: response.status,
    //   events: response.events.map(e => ({
    //     status: e.status,
    //     description: e.description,
    //     location: e.location,
    //     occurred_at: e.occurred_at,
    //   })),
    //   raw_data: response,
    // })

    return new StepResponse({
      status: null as string | null,
      events: [] as Array<{ status: string; description: string; location?: string; occurred_at: string }>,
      raw_data: null as Record<string, unknown> | null,
    })
  }
)

export const syncTrackingWorkflow = createWorkflow(
  "sync-tracking",
  function (input: SyncTrackingInput) {
    const lookupInput = transform({ input }, ({ input }) => ({
      tracking_record_id: input.tracking_record_id,
      tracking_number: "",
      carrier: "",
    }))

    const providerResult = fetchTrackingFromProviderStep(lookupInput)

    const hasUpdates = transform({ providerResult, input }, ({ providerResult, input }) => {
      if (!providerResult.status && providerResult.events.length === 0) {
        return null
      }
      return {
        tracking_record_id: input.tracking_record_id,
        status: providerResult.status || undefined,
        events: providerResult.events,
        raw_data: providerResult.raw_data || undefined,
      }
    })

    return new WorkflowResponse({ providerResult: providerResult, trackingRecordId: input.tracking_record_id })
  }
)
