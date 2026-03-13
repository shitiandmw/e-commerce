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
  link_url?: string
  sort_order?: number
  is_enabled?: boolean
  starts_at?: string
  ends_at?: string
  translations?: Record<string, any>
}

const createAnnouncementStep = createStep(
  "create-announcement-step",
  async (input: CreateAnnouncementInput, { container }) => {
    const announcementService: AnnouncementModuleService = container.resolve(ANNOUNCEMENT_MODULE)
    const data = {
      ...input,
      starts_at: input.starts_at ? new Date(input.starts_at) : undefined,
      ends_at: input.ends_at ? new Date(input.ends_at) : undefined,
    }
    const announcement = await announcementService.createAnnouncements(data)
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
