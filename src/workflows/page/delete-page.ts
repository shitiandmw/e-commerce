import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { PAGE_MODULE } from "../../modules/page"
import PageModuleService from "../../modules/page/service"

type DeletePageInput = {
  id: string
}

const deletePageStep = createStep(
  "delete-page-step",
  async ({ id }: DeletePageInput, { container }) => {
    const pageService: PageModuleService = container.resolve(PAGE_MODULE)
    const page = await pageService.retrievePage(id)
    await pageService.deletePages(id)
    return new StepResponse(id, page)
  },
  async (page: Record<string, unknown>, { container }) => {
    const pageService: PageModuleService = container.resolve(PAGE_MODULE)
    await pageService.createPages(page as any)
  }
)

export const deletePageWorkflow = createWorkflow(
  "delete-page",
  (input: DeletePageInput) => {
    const id = deletePageStep(input)
    return new WorkflowResponse(id)
  }
)
