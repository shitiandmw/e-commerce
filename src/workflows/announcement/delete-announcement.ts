import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ANNOUNCEMENT_MODULE } from "../../modules/announcement"
import AnnouncementModuleService from "../../modules/announcement/service"

type DeleteAnnouncementInput = {
  id: string
}

const deleteAnnouncementStep = createStep(
  "delete-announcement-step",
  async ({ id }: DeleteAnnouncementInput, { container }) => {
    const announcementService: AnnouncementModuleService = container.resolve(ANNOUNCEMENT_MODULE)
    const announcement = await announcementService.retrieveAnnouncement(id)
    await announcementService.deleteAnnouncements(id)
    return new StepResponse(id, announcement)
  },
  async (announcement: Record<string, unknown>, { container }) => {
    const announcementService: AnnouncementModuleService = container.resolve(ANNOUNCEMENT_MODULE)
    await announcementService.createAnnouncements(announcement as any)
  }
)

export const deleteAnnouncementWorkflow = createWorkflow(
  "delete-announcement",
  (input: DeleteAnnouncementInput) => {
    const id = deleteAnnouncementStep(input)
    return new WorkflowResponse(id)
  }
)
