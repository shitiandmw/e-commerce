import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BANNER_MODULE } from "../../modules/banner"
import BannerModuleService from "../../modules/banner/service"

type UpdateBannerSlotInput = {
  id: string
  name?: string
  key?: string
  description?: string | null
}

const updateBannerSlotStep = createStep(
  "update-banner-slot-step",
  async (input: UpdateBannerSlotInput, { container }) => {
    const bannerService: BannerModuleService = container.resolve(BANNER_MODULE)
    const existing = await bannerService.retrieveBannerSlot(input.id)
    const slot = await bannerService.updateBannerSlots(input)
    return new StepResponse(slot, existing)
  },
  async (previous: Record<string, unknown>, { container }) => {
    const bannerService: BannerModuleService = container.resolve(BANNER_MODULE)
    await bannerService.updateBannerSlots(previous as any)
  }
)

export const updateBannerSlotWorkflow = createWorkflow(
  "update-banner-slot",
  (input: UpdateBannerSlotInput) => {
    const slot = updateBannerSlotStep(input)
    return new WorkflowResponse(slot)
  }
)
