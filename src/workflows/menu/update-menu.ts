import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MENU_MODULE } from "../../modules/menu"
import MenuModuleService from "../../modules/menu/service"

type UpdateMenuInput = {
  id: string
  name?: string
  key?: string
  description?: string | null
}

const updateMenuStep = createStep(
  "update-menu-step",
  async (input: UpdateMenuInput, { container }) => {
    const menuService: MenuModuleService = container.resolve(MENU_MODULE)
    const existing = await menuService.retrieveMenu(input.id)
    const menu = await menuService.updateMenus(input)
    return new StepResponse(menu, existing)
  },
  async (previous: Record<string, unknown>, { container }) => {
    const menuService: MenuModuleService = container.resolve(MENU_MODULE)
    await menuService.updateMenus(previous as any)
  }
)

export const updateMenuWorkflow = createWorkflow(
  "update-menu",
  (input: UpdateMenuInput) => {
    const menu = updateMenuStep(input)
    return new WorkflowResponse(menu)
  }
)
