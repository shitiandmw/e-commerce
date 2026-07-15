import { InventoryEvents } from "@medusajs/utils"
import { config } from "../subscribers/restock-demand-inventory"

describe("restock inventory subscriber", () => {
  it("uses the namespaced Medusa inventory events that can restore availability", () => {
    expect(config.event).toEqual(expect.arrayContaining([
      InventoryEvents.INVENTORY_LEVEL_CREATED,
      InventoryEvents.INVENTORY_LEVEL_UPDATED,
      InventoryEvents.INVENTORY_LEVEL_RESTORED,
      InventoryEvents.INVENTORY_ITEM_RESTORED,
      InventoryEvents.RESERVATION_ITEM_UPDATED,
      InventoryEvents.RESERVATION_ITEM_DELETED,
    ]))
    expect(InventoryEvents.INVENTORY_LEVEL_UPDATED).toBe(
      "inventory.inventory-level.updated"
    )
  })
})
