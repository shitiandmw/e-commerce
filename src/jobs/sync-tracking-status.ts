import { MedusaContainer } from "@medusajs/framework/types"
import { TRACKING_MODULE } from "../modules/tracking"

export default async function syncTrackingStatusJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  const trackingService = container.resolve(TRACKING_MODULE)

  logger.info("[sync-tracking] Starting tracking status sync job...")

  try {
    const activeStatuses = ["pending", "in_transit", "out_for_delivery"]

    const records = await trackingService.listTrackingRecords(
      { status: activeStatuses },
      { take: 100, order: { created_at: "ASC" } }
    )

    logger.info(`[sync-tracking] Found ${records.length} active tracking records to sync`)

    // TODO: When carrier API integration is implemented, call syncTrackingWorkflow
    // for each record here. For now this is a no-op placeholder.
    //
    // for (const record of records) {
    //   try {
    //     await syncTrackingWorkflow(container).run({
    //       input: { tracking_record_id: record.id },
    //     })
    //   } catch (error) {
    //     logger.error(`[sync-tracking] Failed to sync ${record.id}: ${error.message}`)
    //   }
    // }

    logger.info("[sync-tracking] Tracking sync job completed (provider integration pending)")
  } catch (error: any) {
    logger.error(`[sync-tracking] Job failed: ${error.message}`)
  }
}

export const config = {
  name: "sync-tracking-status",
  schedule: "0 */4 * * *",
}
