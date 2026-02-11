import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ANNOUNCEMENT_MODULE } from "../../modules/announcement"
import AnnouncementModuleService from "../../modules/announcement/service"

type UpdateAnnouncementInput = {
  id: string
  text?: string
  link_url?: string | null
  sort_order?: number
  is_enabled?: boolean
  starts_at?: string | null
  ends_at?: string | null
}

const updateAnnouncementStep = createStep(
  "update-announcement-step",
  async (input: UpdateAnnouncementInput, { container }) => {
    const announcementService: AnnouncementModuleService = container.resolve(ANNOUNCEMENT_MODULE)
    const existing = await announcementService.retrieveAnnouncement(input.id)
    const announcement = await announcementService.updateAnnouncements(input)
    return new StepResponse(announcement, existing)
  },
  async (previous: Record<string, unknown>, { container }) => {
    const announcementService: AnnouncementModuleService = container.resolve(ANNOUNCEMENT_MODULE)
    await announcementService.updateAnnouncements(previous as any)
  }
)

export const updateAnnouncementWorkflow = createWorkflow(
  "update-announcement",
  (input: UpdateAnnouncementInput) => {
    const announcement = updateAnnouncementStep(input)
    return new WorkflowResponse(announcement)
  }
)
