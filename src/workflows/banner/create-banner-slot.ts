import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BANNER_MODULE } from "../../modules/banner"
import BannerModuleService from "../../modules/banner/service"

type CreateBannerSlotInput = {
  name: string
  key: string
  description?: string
}

const createBannerSlotStep = createStep(
  "create-banner-slot-step",
  async (input: CreateBannerSlotInput, { container }) => {
    const bannerService: BannerModuleService = container.resolve(BANNER_MODULE)
    const slot = await bannerService.createBannerSlots(input)
    return new StepResponse(slot, slot.id)
  },
  async (slotId: string, { container }) => {
    const bannerService: BannerModuleService = container.resolve(BANNER_MODULE)
    await bannerService.deleteBannerSlots(slotId)
  }
)

export const createBannerSlotWorkflow = createWorkflow(
  "create-banner-slot",
  (input: CreateBannerSlotInput) => {
    const slot = createBannerSlotStep(input)
    return new WorkflowResponse(slot)
  }
)
