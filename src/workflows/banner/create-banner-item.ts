import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BANNER_MODULE } from "../../modules/banner"
import BannerModuleService from "../../modules/banner/service"

type CreateBannerItemInput = {
  slot_id: string
  image_url: string
  title?: string
  subtitle?: string
  link_url?: string
  sort_order?: number
  is_enabled?: boolean
  starts_at?: string | Date | null
  ends_at?: string | Date | null
  translations?: Record<string, any> | null
}

const createBannerItemStep = createStep(
  "create-banner-item-step",
  async (input: CreateBannerItemInput, { container }) => {
    const bannerService: BannerModuleService = container.resolve(BANNER_MODULE)
    const data = {
      ...input,
      starts_at: input.starts_at ? new Date(input.starts_at) : null,
      ends_at: input.ends_at ? new Date(input.ends_at) : null,
    }
    const item = await bannerService.createBannerItems(data)
    return new StepResponse(item, item.id)
  },
  async (itemId: string, { container }) => {
    const bannerService: BannerModuleService = container.resolve(BANNER_MODULE)
    await bannerService.deleteBannerItems(itemId)
  }
)

export const createBannerItemWorkflow = createWorkflow(
  "create-banner-item",
  (input: CreateBannerItemInput) => {
    const item = createBannerItemStep(input)
    return new WorkflowResponse(item)
  }
)
