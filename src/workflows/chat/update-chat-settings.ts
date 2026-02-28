import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CHAT_MODULE } from "../../modules/chat"
import ChatModuleService from "../../modules/chat/service"

type UpdateChatSettingsInput = {
  welcome_message?: string | null
  offline_message?: string | null
  business_hours?: Record<string, any> | null
}

const updateChatSettingsStep = createStep(
  "update-chat-settings-step",
  async (input: UpdateChatSettingsInput, { container }) => {
    const chatService: ChatModuleService = container.resolve(CHAT_MODULE)

    // Get or create settings (single row)
    const existing = await chatService.listChatSettings({}, { take: 1 })
    let settings: any

    if (existing.length > 0) {
      const previous = existing[0]
      settings = await chatService.updateChatSettings({ id: previous.id, ...input } as any)
      return new StepResponse(settings, previous)
    } else {
      settings = await chatService.createChatSettings(input as any)
      return new StepResponse(settings, null)
    }
  },
  async (previous: Record<string, unknown> | null, { container }) => {
    if (!previous) return
    const chatService: ChatModuleService = container.resolve(CHAT_MODULE)
    await chatService.updateChatSettings({ id: (previous as any).id, ...previous } as any)
  }
)

export const updateChatSettingsWorkflow = createWorkflow(
  "update-chat-settings",
  (input: UpdateChatSettingsInput) => {
    const settings = updateChatSettingsStep(input)
    return new WorkflowResponse(settings)
  }
)
