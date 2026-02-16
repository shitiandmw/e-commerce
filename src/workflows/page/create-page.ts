import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { PAGE_MODULE } from "../../modules/page"
import PageModuleService from "../../modules/page/service"

type CreatePageInput = {
  title: string
  slug: string
  content?: string
  status?: string
  template?: string | null
  sort_order?: number
  translations?: Record<string, any> | null
  seo?: Record<string, any> | null
}

const createPageStep = createStep(
  "create-page-step",
  async (input: CreatePageInput, { container }) => {
    const pageService: PageModuleService = container.resolve(PAGE_MODULE)
    const page = await pageService.createPages(input)
    return new StepResponse(page, page.id)
  },
  async (pageId: string, { container }) => {
    const pageService: PageModuleService = container.resolve(PAGE_MODULE)
    await pageService.deletePages(pageId)
  }
)

export const createPageWorkflow = createWorkflow(
  "create-page",
  (input: CreatePageInput) => {
    const page = createPageStep(input)
    return new WorkflowResponse(page)
  }
)
