import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BRAND_MODULE } from "../../modules/brand"
import BrandModuleService from "../../modules/brand/service"

type CreateBrandInput = {
  name: string
  description?: string
  logo_url?: string
  translations?: Record<string, any> | null
}

const createBrandStep = createStep(
  "create-brand-step",
  async (input: CreateBrandInput, { container }) => {
    const brandService: BrandModuleService = container.resolve(BRAND_MODULE)
    const brand = await brandService.createBrands(input)
    return new StepResponse(brand, brand.id)
  },
  async (brandId: string, { container }) => {
    const brandService: BrandModuleService = container.resolve(BRAND_MODULE)
    await brandService.deleteBrands(brandId)
  }
)

export const createBrandWorkflow = createWorkflow(
  "create-brand",
  (input: CreateBrandInput) => {
    const brand = createBrandStep(input)
    return new WorkflowResponse(brand)
  }
)
