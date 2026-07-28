import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  canAccessConversation,
  resolveStoreChatIdentity,
} from "../../../../../lib/chat-auth"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const { id } = req.params

  const { data: [conversation] } = await query.graph({
    entity: "conversation",
    fields: ["*"],
    filters: { id },
  })

  if (!conversation) {
    res.status(404).json({ message: "Conversation not found" })
    return
  }

  const identity = resolveStoreChatIdentity({
    authorization: req.headers.authorization,
    conversationToken: req.headers["x-chat-conversation-token"],
  })
  if (!identity || !canAccessConversation(identity, conversation as any)) {
    return res.status(404).json({ message: "Conversation not found" })
  }

  res.json({ conversation })
}
