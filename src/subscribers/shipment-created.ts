import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function shipmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  logger.info(`[shipment-created] Order shipment created event received: ${data.id}`)

  // The tracking record is created explicitly via the admin API when
  // the operator enters the tracking number. This subscriber serves
  // as a hook point for future automation (e.g., auto-register tracking
  // with AfterShip when a shipment label is generated).
}

export const config: SubscriberConfig = {
  event: "order.shipment_created",
}
