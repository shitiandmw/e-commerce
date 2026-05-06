import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * Webhook endpoint for receiving tracking updates from external providers
 * (e.g., AfterShip, TrackingMore).
 *
 * Placeholder: implement signature verification and payload parsing
 * when integrating with a specific provider.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve("logger")

  logger.info("[tracking-webhook] Received webhook payload (provider integration pending)")

  // TODO: Verify webhook signature
  // TODO: Parse provider-specific payload
  // TODO: Map to tracking_record_id and call updateTrackingStatusWorkflow

  res.json({ received: true })
}
