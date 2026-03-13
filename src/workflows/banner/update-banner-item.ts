import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BANNER_MODULE } from "../../modules/banner"
import BannerModuleService from "../../modules/banner/service"

type UpdateBannerItemInput = {
  id: string
  slot_id?: string
  image_url?: string
  title?: string
  subtitle?: string
  link_url?: string
  sort_order?: number
  is_enabled?: boolean
  starts_at?: string
  ends_at?: string
  translations?: Record<string, any>
}

const updateBannerItemStep = createStep(
  "update-banner-item-step",
  async (input: UpdateBannerItemInput, { container }) => {
    const bannerService: BannerModuleService = container.resolve(BANNER_MODULE)
    const existing = await bannerService.retrieveBannerItem(input.id)
    const data: Record<string, unknown> = { ...input }
    if (input.starts_at !== undefined) {
      data.starts_at = input.starts_at ? new Date(input.starts_at) : undefined
    }
    if (input.ends_at !== undefined) {
      data.ends_at = input.ends_at ? new Date(input.ends_at) : undefined
    }
    const item = await bannerService.updateBannerItems(data as any)
    return new StepResponse(item, existing)
  },
  async (previous: Record<string, unknown>, { container }) => {
    const bannerService: BannerModuleService = container.resolve(BANNER_MODULE)
    await bannerService.updateBannerItems(previous as any)
  }
)

export const updateBannerItemWorkflow = createWorkflow(
  "update-banner-item",
  (input: UpdateBannerItemInput) => {
    const item = updateBannerItemStep(input)
    return new WorkflowResponse(item)
  }
)
