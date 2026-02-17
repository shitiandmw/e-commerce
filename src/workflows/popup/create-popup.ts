import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { POPUP_MODULE } from "../../modules/popup"
import PopupModuleService from "../../modules/popup/service"

type CreatePopupInput = {
  title?: string | null
  description?: string | null
  image_url?: string | null
  button_text?: string | null
  button_link?: string | null
  is_enabled?: boolean
  trigger_type?: "first_visit" | "every_visit" | "specific_page"
  display_frequency?: "once" | "once_per_session" | "once_per_day"
  target_page?: string | null
  sort_order?: number
  popup_type?: "general" | "coupon"
  coupon_code?: string | null
}

const createPopupStep = createStep(
  "create-popup-step",
  async (input: CreatePopupInput, { container }) => {
    const popupService: PopupModuleService = container.resolve(POPUP_MODULE)
    const popup = await popupService.createPopups(input)
    return new StepResponse(popup, popup.id)
  },
  async (popupId: string, { container }) => {
    const popupService: PopupModuleService = container.resolve(POPUP_MODULE)
    await popupService.deletePopups(popupId)
  }
)

export const createPopupWorkflow = createWorkflow(
  "create-popup",
  (input: CreatePopupInput) => {
    const popup = createPopupStep(input)
    return new WorkflowResponse(popup)
  }
)
