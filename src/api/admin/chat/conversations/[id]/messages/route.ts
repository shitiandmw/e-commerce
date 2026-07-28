import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { sendMessageWorkflow } from "../../../../../../workflows/chat/send-message"
import {
  broadcastChatMessage,
} from "../../../../../../lib/socket-io"
import { isAllowedChatImageUrl } from "../../../../../../lib/chat-message"
import { CHAT_MODULE } from "../../../../../../modules/chat"
import ChatModuleService from "../../../../../../modules/chat/service"
import { PostAdminSendChatMessageType } from "../../../validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const { id } = req.params

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
  req: MedusaRequest<PostAdminSendChatMessageType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const body = req.validatedBody
  const agentId = (req as any).auth_context?.actor_id as string | undefined
  const chatService: ChatModuleService = req.scope.resolve(CHAT_MODULE)

  if (!agentId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  let conversation: any
  try {
    conversation = await chatService.retrieveConversation(id)
  } catch {
    return res.status(404).json({ message: "Conversation not found" })
  }

  if (conversation.status === "closed") {
    return res.status(409).json({ message: "Conversation is closed" })
  }

  if (body.message_type === "image") {
    const requestOrigin = `${req.protocol}://${req.get("host")}`
    if (!isAllowedChatImageUrl(body.content, requestOrigin)) {
      return res.status(400).json({ message: "Image URL is not from an allowed upload origin" })
    }
  }

  const { result } = await sendMessageWorkflow(req.scope).run({
    input: {
      conversation_id: id,
      sender_type: "agent",
      sender_id: agentId,
      content: body.content,
      message_type: body.message_type || "text",
      metadata: body.message_type === "image" ? body.metadata : undefined,
    },
  })

  broadcastChatMessage(id, result as any)

  res.status(201).json({ message: result })
}
