import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MENU_MODULE } from "../../modules/menu"
import MenuModuleService from "../../modules/menu/service"

type DeleteMenuItemInput = {
  id: string
}

const deleteMenuItemStep = createStep(
  "delete-menu-item-step",
  async ({ id }: DeleteMenuItemInput, { container }) => {
    const menuService: MenuModuleService = container.resolve(MENU_MODULE)
    const item = await menuService.retrieveMenuItem(id)
    await menuService.deleteMenuItems(id)
    return new StepResponse(id, item)
  },
  async (item: Record<string, unknown>, { container }) => {
    const menuService: MenuModuleService = container.resolve(MENU_MODULE)
    await menuService.createMenuItems(item as any)
  }
)

export const deleteMenuItemWorkflow = createWorkflow(
  "delete-menu-item",
  (input: DeleteMenuItemInput) => {
    const id = deleteMenuItemStep(input)
    return new WorkflowResponse(id)
  }
)
