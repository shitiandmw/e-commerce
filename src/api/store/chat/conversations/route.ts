import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createConversationWorkflow } from "../../../../workflows/chat/create-conversation"
import { PostStoreCreateConversationType } from "../validators"
import {
  extractBearerToken,
  signVisitorConversationToken,
  verifyMedusaChatActorToken,
  verifyVisitorConversationToken,
} from "../../../../lib/chat-auth"
import { randomUUID } from "crypto"

export const POST = async (
  req: MedusaRequest<PostStoreCreateConversationType>,
  res: MedusaResponse
) => {
  const bearerToken = extractBearerToken(req.headers.authorization)
  const actor = bearerToken ? verifyMedusaChatActorToken(bearerToken) : null

  if (bearerToken && actor?.role !== "customer") {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const existingVisitorIdentity = req.validatedBody.conversation_token
    ? verifyVisitorConversationToken(req.validatedBody.conversation_token)
    : null
  if (req.validatedBody.conversation_token && !existingVisitorIdentity) {
    return res.status(401).json({ message: "Invalid conversation token" })
  }

  const customerId = actor?.role === "customer" ? actor.id : null
  const visitorId = customerId
    ? undefined
    : existingVisitorIdentity?.id || req.validatedBody.visitor_id || randomUUID()

  const { result } = await createConversationWorkflow(req.scope).run({
    input: {
      customer_id: customerId || undefined,
      visitor_id: visitorId,
    },
  })

  const conversationToken = customerId
    ? null
    : signVisitorConversationToken({
        conversation_id: result.id,
        visitor_id: result.visitor_id || visitorId!,
      })

  res.json({ conversation: result, conversation_token: conversationToken })
}
