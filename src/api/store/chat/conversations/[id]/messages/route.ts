import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { sendMessageWorkflow } from "../../../../../../workflows/chat/send-message"
import {
  canAccessConversation,
  resolveStoreChatIdentity,
} from "../../../../../../lib/chat-auth"
import {
  broadcastChatMessage,
  broadcastConversationActivity,
  triggerAIResponse,
} from "../../../../../../lib/socket-io"
import { CHAT_MODULE } from "../../../../../../modules/chat"
import ChatModuleService from "../../../../../../modules/chat/service"
import { PostStoreSendChatMessageType } from "../../../validators"

async function getAuthorizedConversation(req: MedusaRequest, id: string) {
  const chatService: ChatModuleService = req.scope.resolve(CHAT_MODULE)
  let conversation: any
  try {
    conversation = await chatService.retrieveConversation(id)
  } catch {
    return null
  }

  const identity = resolveStoreChatIdentity({
    authorization: req.headers.authorization,
    conversationToken: req.headers["x-chat-conversation-token"],
  })
  if (!identity || !canAccessConversation(identity, conversation)) return null
  return { conversation, identity }
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const { id } = req.params

  const authorized = await getAuthorizedConversation(req, id)
  if (!authorized) {
    return res.status(404).json({ message: "Conversation not found" })
  }

  const url = new URL(req.url || "", `http://${req.headers.host}`)
  const offset = parseInt(url.searchParams.get("offset") || "0", 10)
  const limit = parseInt(url.searchParams.get("limit") || "50", 10)

  const { data: messages, metadata } = await query.graph({
    entity: "chat_message",
    fields: ["id", "sender_type", "sender_id", "content", "message_type", "metadata", "created_at"],
    filters: { conversation_id: id },
    pagination: {
      skip: offset,
      take: limit,
      order: { created_at: "ASC" },
    },
  })

  res.json({
    chat_messages: messages,
    count: metadata?.count || messages.length,
    offset,
    limit,
  })
}

export const POST = async (
  req: MedusaRequest<PostStoreSendChatMessageType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const authorized = await getAuthorizedConversation(req, id)
  if (!authorized) {
    return res.status(404).json({ message: "Conversation not found" })
  }
  if (authorized.conversation.status === "closed") {
    return res.status(409).json({ message: "Conversation is closed" })
  }

  const { result } = await sendMessageWorkflow(req.scope).run({
    input: {
      conversation_id: id,
      sender_type: authorized.identity.role,
      sender_id: authorized.identity.id,
      content: req.validatedBody.content,
      message_type: "text",
    },
  })

  broadcastChatMessage(id, result as any)
  broadcastConversationActivity(id, {
    content: req.validatedBody.content,
    message_type: "text",
    sender_type: authorized.identity.role,
  })
  triggerAIResponse(id, req.scope)

  res.status(201).json({ message: result })
}
