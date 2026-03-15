import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { sendMessageWorkflow } from "../../../../../../workflows/chat/send-message"
import { triggerAIResponse } from "../../../../../../lib/socket-io"

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
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const { content, sender_type } = req.body as { content: string; sender_type?: string }
  const agentId = (req as any).auth_context?.actor_id || "admin"

  const { result } = await sendMessageWorkflow(req.scope).run({
    input: {
      conversation_id: id,
      sender_type: (sender_type || "agent") as any,
      sender_id: sender_type === "customer" ? "test_customer" : agentId,
      content,
      message_type: "text",
    },
  })

  // 触发AI自动回复(如果是客户消息)
  if (sender_type === "customer") {
    console.log('[API] Triggering AI response for conversation:', id)
    triggerAIResponse(id, req.scope)
  }

  res.json({ message: result })
}
