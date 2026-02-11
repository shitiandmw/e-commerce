import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { POPUP_MODULE } from "../../modules/popup"
import PopupModuleService from "../../modules/popup/service"

type UpdatePopupInput = {
  id: string
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
}

const updatePopupStep = createStep(
  "update-popup-step",
  async (input: UpdatePopupInput, { container }) => {
    const popupService: PopupModuleService = container.resolve(POPUP_MODULE)
    const existing = await popupService.retrievePopup(input.id)
    const popup = await popupService.updatePopups(input)
    return new StepResponse(popup, existing)
  },
  async (previous: Record<string, unknown>, { container }) => {
    const popupService: PopupModuleService = container.resolve(POPUP_MODULE)
    await popupService.updatePopups(previous as any)
  }
)

export const updatePopupWorkflow = createWorkflow(
  "update-popup",
  (input: UpdatePopupInput) => {
    const popup = updatePopupStep(input)
    return new WorkflowResponse(popup)
  }
)
