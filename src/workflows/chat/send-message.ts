import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CHAT_MODULE } from "../../modules/chat"
import ChatModuleService from "../../modules/chat/service"

type SendMessageInput = {
  conversation_id: string
  sender_type: "customer" | "visitor" | "agent" | "system"
  sender_id: string
  content: string
  message_type?: "text" | "image" | "system"
  metadata?: Record<string, any>
}

const sendMessageStep = createStep(
  "send-message-step",
  async (input: SendMessageInput, { container }) => {
    const chatService: ChatModuleService = container.resolve(CHAT_MODULE)

    const message = await chatService.createChatMessages({
      conversation_id: input.conversation_id,
      sender_type: input.sender_type,
      sender_id: input.sender_id,
      content: input.content,
      message_type: input.message_type || "text",
      metadata: input.metadata || null,
    } as any)

    return new StepResponse(message, message.id)
  },
  async (messageId: string, { container }) => {
    const chatService: ChatModuleService = container.resolve(CHAT_MODULE)
    await chatService.deleteChatMessages(messageId)
  }
)

const updateConversationLastMessageStep = createStep(
  "update-conversation-last-message-step",
  async (input: { conversation_id: string; content: string; sender_type: string }, { container }) => {
    const chatService: ChatModuleService = container.resolve(CHAT_MODULE)

    const existing = await chatService.retrieveConversation(input.conversation_id)
    const previousState = {
      last_message_preview: existing.last_message_preview,
      last_message_at: existing.last_message_at,
      unread_count: existing.unread_count,
    }

    const updateData: Record<string, any> = {
      last_message_preview: input.content.substring(0, 100),
      last_message_at: new Date(),
    }

    // Increment unread count if message is not from agent
    if (input.sender_type !== "agent") {
      updateData.unread_count = (existing.unread_count || 0) + 1
    }

    await chatService.updateConversations({ id: input.conversation_id, ...updateData } as any)

    return new StepResponse(null, { id: input.conversation_id, ...previousState })
  },
  async (previous: Record<string, any>, { container }) => {
    if (!previous) return
    const chatService: ChatModuleService = container.resolve(CHAT_MODULE)
    const { id, ...data } = previous
    await chatService.updateConversations({ id: previous.id, ...data } as any)
  }
)

export const sendMessageWorkflow = createWorkflow(
  "send-message",
  (input: SendMessageInput) => {
    const message = sendMessageStep(input)
    updateConversationLastMessageStep(input)
    return new WorkflowResponse(message)
  }
)
