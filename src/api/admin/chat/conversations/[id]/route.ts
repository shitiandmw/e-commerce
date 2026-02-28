import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { updateConversationWorkflow } from "../../../../../workflows/chat/update-conversation"
import { PostAdminUpdateConversationType } from "../../validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const { id } = req.params

  const { data: [conversation] } = await query.graph({
    entity: "conversation",
    fields: ["*", "messages.*"],
    filters: { id },
  })

  if (!conversation) {
    res.status(404).json({ message: "Conversation not found" })
    return
  }

  res.json({ conversation })
}

export const POST = async (
  req: MedusaRequest<PostAdminUpdateConversationType>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await updateConversationWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody,
    },
  })

  res.json({ conversation: result })
}
