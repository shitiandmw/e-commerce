import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ANNOUNCEMENT_MODULE } from "../../modules/announcement"
import AnnouncementModuleService from "../../modules/announcement/service"

type CreateAnnouncementInput = {
  text: string
  link_url?: string | null
  sort_order?: number
  is_enabled?: boolean
  starts_at?: string | null
  ends_at?: string | null
  translations?: Record<string, any> | null
}

const createAnnouncementStep = createStep(
  "create-announcement-step",
  async (input: CreateAnnouncementInput, { container }) => {
    const announcementService: AnnouncementModuleService = container.resolve(ANNOUNCEMENT_MODULE)
    const announcement = await announcementService.createAnnouncements(input)
    return new StepResponse(announcement, announcement.id)
  },
  async (announcementId: string, { container }) => {
    const announcementService: AnnouncementModuleService = container.resolve(ANNOUNCEMENT_MODULE)
    await announcementService.deleteAnnouncements(announcementId)
  }
)

export const createAnnouncementWorkflow = createWorkflow(
  "create-announcement",
  (input: CreateAnnouncementInput) => {
    const announcement = createAnnouncementStep(input)
    return new WorkflowResponse(announcement)
  }
)
