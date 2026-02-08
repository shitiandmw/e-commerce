import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BRAND_MODULE } from "../../modules/brand"
import BrandModuleService from "../../modules/brand/service"

type DeleteBrandInput = {
  id: string
}

const deleteBrandStep = createStep(
  "delete-brand-step",
  async ({ id }: DeleteBrandInput, { container }) => {
    const brandService: BrandModuleService = container.resolve(BRAND_MODULE)
    const brand = await brandService.retrieveBrand(id)
    await brandService.deleteBrands(id)
    return new StepResponse(id, brand)
  },
  async (brand: Record<string, unknown>, { container }) => {
    const brandService: BrandModuleService = container.resolve(BRAND_MODULE)
    await brandService.createBrands(brand as any)
  }
)

const dismissBrandLinksStep = createStep(
  "dismiss-brand-links-step",
  async ({ id }: DeleteBrandInput, { container }) => {
    const remoteLink = container.resolve("remoteLink") as any
    await remoteLink.dismiss({
      [BRAND_MODULE]: {
        brand_id: id,
      },
    })
    return new StepResponse(undefined)
  }
)

export const deleteBrandWorkflow = createWorkflow(
  "delete-brand",
  (input: DeleteBrandInput) => {
    dismissBrandLinksStep(input)
    const id = deleteBrandStep(input)
    return new WorkflowResponse(id)
  }
)
