import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MENU_MODULE } from "../../modules/menu"
import MenuModuleService from "../../modules/menu/service"

type UpdateMenuItemInput = {
  id: string
  label?: string
  url?: string | null
  icon_url?: string | null
  sort_order?: number
  is_enabled?: boolean
  metadata?: Record<string, unknown> | null
  parent_id?: string | null
}

const updateMenuItemStep = createStep(
  "update-menu-item-step",
  async (input: UpdateMenuItemInput, { container }) => {
    const menuService: MenuModuleService = container.resolve(MENU_MODULE)
    const existing = await menuService.retrieveMenuItem(input.id)
    const item = await menuService.updateMenuItems(input)
    return new StepResponse(item, existing)
  },
  async (previous: Record<string, unknown>, { container }) => {
    const menuService: MenuModuleService = container.resolve(MENU_MODULE)
    await menuService.updateMenuItems(previous as any)
  }
)

export const updateMenuItemWorkflow = createWorkflow(
  "update-menu-item",
  (input: UpdateMenuItemInput) => {
    const item = updateMenuItemStep(input)
    return new WorkflowResponse(item)
  }
)
