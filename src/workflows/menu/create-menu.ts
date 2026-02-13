import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MENU_MODULE } from "../../modules/menu"
import MenuModuleService from "../../modules/menu/service"

type CreateMenuInput = {
  name: string
  key: string
  description?: string
}

const createMenuStep = createStep(
  "create-menu-step",
  async (input: CreateMenuInput, { container }) => {
    const menuService: MenuModuleService = container.resolve(MENU_MODULE)
    const menu = await menuService.createMenus(input)
    return new StepResponse(menu, menu.id)
  },
  async (menuId: string, { container }) => {
    const menuService: MenuModuleService = container.resolve(MENU_MODULE)
    await menuService.deleteMenus(menuId)
  }
)

export const createMenuWorkflow = createWorkflow(
  "create-menu",
  (input: CreateMenuInput) => {
    const menu = createMenuStep(input)
    return new WorkflowResponse(menu)
  }
)
