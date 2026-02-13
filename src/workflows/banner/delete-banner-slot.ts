import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BANNER_MODULE } from "../../modules/banner"
import BannerModuleService from "../../modules/banner/service"

type DeleteBannerSlotInput = {
  id: string
}

const deleteBannerSlotStep = createStep(
  "delete-banner-slot-step",
  async ({ id }: DeleteBannerSlotInput, { container }) => {
    const bannerService: BannerModuleService = container.resolve(BANNER_MODULE)
    const slot = await bannerService.retrieveBannerSlot(id)
    await bannerService.deleteBannerSlots(id)
    return new StepResponse(id, slot)
  },
  async (slot: Record<string, unknown>, { container }) => {
    const bannerService: BannerModuleService = container.resolve(BANNER_MODULE)
    await bannerService.createBannerSlots(slot as any)
  }
)

export const deleteBannerSlotWorkflow = createWorkflow(
  "delete-banner-slot",
  (input: DeleteBannerSlotInput) => {
    const id = deleteBannerSlotStep(input)
    return new WorkflowResponse(id)
  }
)
