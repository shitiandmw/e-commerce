import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BRAND_MODULE } from "../../modules/brand"
import BrandModuleService from "../../modules/brand/service"

type UpdateBrandInput = {
  id: string
  name?: string
  description?: string | null
  logo_url?: string | null
  translations?: Record<string, any> | null
}

const updateBrandStep = createStep(
  "update-brand-step",
  async (input: UpdateBrandInput, { container }) => {
    const brandService: BrandModuleService = container.resolve(BRAND_MODULE)
    const existing = await brandService.retrieveBrand(input.id)
    const brand = await brandService.updateBrands(input)
    return new StepResponse(brand, existing)
  },
  async (previous: Record<string, unknown>, { container }) => {
    const brandService: BrandModuleService = container.resolve(BRAND_MODULE)
    await brandService.updateBrands(previous as any)
  }
)

export const updateBrandWorkflow = createWorkflow(
  "update-brand",
  (input: UpdateBrandInput) => {
    const brand = updateBrandStep(input)
    return new WorkflowResponse(brand)
  }
)
