import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { PAGE_MODULE } from "../../modules/page"
import PageModuleService from "../../modules/page/service"

type UpdatePageInput = {
  id: string
  title?: string
  slug?: string
  content?: string | null
  status?: string
  template?: string | null
  sort_order?: number
}

const updatePageStep = createStep(
  "update-page-step",
  async (input: UpdatePageInput, { container }) => {
    const pageService: PageModuleService = container.resolve(PAGE_MODULE)
    const existing = await pageService.retrievePage(input.id)
    const page = await pageService.updatePages(input)
    return new StepResponse(page, existing)
  },
  async (previous: Record<string, unknown>, { container }) => {
    const pageService: PageModuleService = container.resolve(PAGE_MODULE)
    await pageService.updatePages(previous as any)
  }
)

export const updatePageWorkflow = createWorkflow(
  "update-page",
  (input: UpdatePageInput) => {
    const page = updatePageStep(input)
    return new WorkflowResponse(page)
  }
)
