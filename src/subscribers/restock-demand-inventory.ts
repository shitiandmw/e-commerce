import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { InventoryEvents } from "@medusajs/utils"
import { reconcilePendingRestockRounds } from "../lib/restock-demand"

export default async function restockDemandInventoryHandler({
  container,
}: SubscriberArgs<Record<string, unknown>>) {
  const logger = container.resolve("logger")

  try {
    await reconcilePendingRestockRounds(container)
  } catch (error) {
    logger.error(
      `[restock-demand] Failed to reconcile pending rounds after inventory change: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: [
    InventoryEvents.INVENTORY_LEVEL_CREATED,
    InventoryEvents.INVENTORY_LEVEL_UPDATED,
    InventoryEvents.INVENTORY_LEVEL_RESTORED,
    InventoryEvents.INVENTORY_ITEM_RESTORED,
    InventoryEvents.INVENTORY_ITEM_ATTACHED,
    InventoryEvents.RESERVATION_ITEM_UPDATED,
    InventoryEvents.RESERVATION_ITEM_DELETED,
  ],
}
