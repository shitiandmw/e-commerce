import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MENU_MODULE } from "../../modules/menu"
import MenuModuleService from "../../modules/menu/service"

type ReorderItem = {
  id: string
  sort_order: number
  parent_id?: string | null
}

type ReorderMenuItemsInput = {
  items: ReorderItem[]
}

const reorderMenuItemsStep = createStep(
  "reorder-menu-items-step",
  async ({ items }: ReorderMenuItemsInput, { container }) => {
    const menuService: MenuModuleService = container.resolve(MENU_MODULE)

    // Save previous state for compensation
    const previousStates: Record<string, unknown>[] = []
    for (const item of items) {
      const existing = await menuService.retrieveMenuItem(item.id)
      previousStates.push({
        id: existing.id,
        sort_order: existing.sort_order,
        parent_id: existing.parent_id,
      })
    }

    // Batch update all items
    const updated = await menuService.updateMenuItems(
      items.map((item) => ({
        id: item.id,
        sort_order: item.sort_order,
        ...(item.parent_id !== undefined ? { parent_id: item.parent_id } : {}),
      }))
    )

    return new StepResponse(updated, previousStates)
  },
  async (previousStates: Record<string, unknown>[], { container }) => {
    const menuService: MenuModuleService = container.resolve(MENU_MODULE)
    await menuService.updateMenuItems(previousStates as any)
  }
)

export const reorderMenuItemsWorkflow = createWorkflow(
  "reorder-menu-items",
  (input: ReorderMenuItemsInput) => {
    const items = reorderMenuItemsStep(input)
    return new WorkflowResponse(items)
  }
)
