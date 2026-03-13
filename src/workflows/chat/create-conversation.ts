import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CHAT_MODULE } from "../../modules/chat"
import ChatModuleService from "../../modules/chat/service"

type CreateConversationInput = {
  visitor_id?: string
  customer_id?: string
}

const createConversationStep = createStep(
  "create-conversation-step",
  async (input: CreateConversationInput, { container }) => {
    const chatService: ChatModuleService = container.resolve(CHAT_MODULE)

    // Try to find an existing open conversation for this user
    const filters: Record<string, any> = { status: "open" }
    if (input.customer_id) {
      filters.customer_id = input.customer_id
    } else if (input.visitor_id) {
      filters.visitor_id = input.visitor_id
    }

    const existing = await chatService.listConversations(filters, {
      take: 1,
      order: { created_at: "DESC" },
    })

    if (existing.length > 0) {
      return new StepResponse(existing[0], null)
    }

    const conversation = await chatService.createConversations({
      visitor_id: input.customer_id ? null : (input.visitor_id || null),
      customer_id: input.customer_id || null,
      status: "open",
    } as any)

    return new StepResponse(conversation, conversation.id)
  },
  async (conversationId: string | null, { container }) => {
    if (!conversationId) return
    const chatService: ChatModuleService = container.resolve(CHAT_MODULE)
    await chatService.deleteConversations(conversationId)
  }
)

export const createConversationWorkflow = createWorkflow(
  "create-conversation",
  (input: CreateConversationInput) => {
    const conversation = createConversationStep(input)
    return new WorkflowResponse(conversation)
  }
)
