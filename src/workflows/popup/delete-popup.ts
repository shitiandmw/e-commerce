import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { POPUP_MODULE } from "../../modules/popup"
import PopupModuleService from "../../modules/popup/service"

type DeletePopupInput = {
  id: string
}

const deletePopupStep = createStep(
  "delete-popup-step",
  async ({ id }: DeletePopupInput, { container }) => {
    const popupService: PopupModuleService = container.resolve(POPUP_MODULE)
    const popup = await popupService.retrievePopup(id)
    await popupService.deletePopups(id)
    return new StepResponse(id, popup)
  },
  async (popup: Record<string, unknown>, { container }) => {
    const popupService: PopupModuleService = container.resolve(POPUP_MODULE)
    await popupService.createPopups(popup as any)
  }
)

export const deletePopupWorkflow = createWorkflow(
  "delete-popup",
  (input: DeletePopupInput) => {
    const id = deletePopupStep(input)
    return new WorkflowResponse(id)
  }
)
