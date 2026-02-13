import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BANNER_MODULE } from "../../modules/banner"
import BannerModuleService from "../../modules/banner/service"

type DeleteBannerItemInput = {
  id: string
}

const deleteBannerItemStep = createStep(
  "delete-banner-item-step",
  async ({ id }: DeleteBannerItemInput, { container }) => {
    const bannerService: BannerModuleService = container.resolve(BANNER_MODULE)
    const item = await bannerService.retrieveBannerItem(id)
    await bannerService.deleteBannerItems(id)
    return new StepResponse(id, item)
  },
  async (item: Record<string, unknown>, { container }) => {
    const bannerService: BannerModuleService = container.resolve(BANNER_MODULE)
    await bannerService.createBannerItems(item as any)
  }
)

export const deleteBannerItemWorkflow = createWorkflow(
  "delete-banner-item",
  (input: DeleteBannerItemInput) => {
    const id = deleteBannerItemStep(input)
    return new WorkflowResponse(id)
  }
)
