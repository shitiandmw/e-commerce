import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MENU_MODULE } from "../../modules/menu"
import MenuModuleService from "../../modules/menu/service"

type CreateMenuItemInput = {
  menu_id: string
  label: string
  url?: string | null
  icon_url?: string | null
  sort_order?: number
  is_enabled?: boolean
  metadata?: Record<string, unknown> | null
  parent_id?: string | null
}

const createMenuItemStep = createStep(
  "create-menu-item-step",
  async (input: CreateMenuItemInput, { container }) => {
    const menuService: MenuModuleService = container.resolve(MENU_MODULE)
    const item = await menuService.createMenuItems(input)
    return new StepResponse(item, item.id)
  },
  async (itemId: string, { container }) => {
    const menuService: MenuModuleService = container.resolve(MENU_MODULE)
    await menuService.deleteMenuItems(itemId)
  }
)

export const createMenuItemWorkflow = createWorkflow(
  "create-menu-item",
  (input: CreateMenuItemInput) => {
    const item = createMenuItemStep(input)
    return new WorkflowResponse(item)
  }
)
