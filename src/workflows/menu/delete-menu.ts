import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MENU_MODULE } from "../../modules/menu"
import MenuModuleService from "../../modules/menu/service"

type DeleteMenuInput = {
  id: string
}

const deleteMenuStep = createStep(
  "delete-menu-step",
  async ({ id }: DeleteMenuInput, { container }) => {
    const menuService: MenuModuleService = container.resolve(MENU_MODULE)
    const menu = await menuService.retrieveMenu(id)
    await menuService.deleteMenus(id)
    return new StepResponse(id, menu)
  },
  async (menu: Record<string, unknown>, { container }) => {
    const menuService: MenuModuleService = container.resolve(MENU_MODULE)
    await menuService.createMenus(menu as any)
  }
)

export const deleteMenuWorkflow = createWorkflow(
  "delete-menu",
  (input: DeleteMenuInput) => {
    const id = deleteMenuStep(input)
    return new WorkflowResponse(id)
  }
)
