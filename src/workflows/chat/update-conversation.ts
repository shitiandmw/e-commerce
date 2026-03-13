import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CHAT_MODULE } from "../../modules/chat"
import ChatModuleService from "../../modules/chat/service"

type UpdateConversationInput = {
  id: string
  status?: "open" | "closed"
  assigned_agent_id?: string
  unread_count?: number
}

const updateConversationStep = createStep(
  "update-conversation-step",
  async (input: UpdateConversationInput, { container }) => {
    const chatService: ChatModuleService = container.resolve(CHAT_MODULE)
    const existing = await chatService.retrieveConversation(input.id)

    const { id, ...data } = input
    const conversation = await chatService.updateConversations({ id, ...data } as any)

    return new StepResponse(conversation, existing)
  },
  async (previous: Record<string, unknown>, { container }) => {
    if (!previous) return
    const chatService: ChatModuleService = container.resolve(CHAT_MODULE)
    await chatService.updateConversations({ id: (previous as any).id, ...previous } as any)
  }
)

export const updateConversationWorkflow = createWorkflow(
  "update-conversation",
  (input: UpdateConversationInput) => {
    const conversation = updateConversationStep(input)
    return new WorkflowResponse(conversation)
  }
)
