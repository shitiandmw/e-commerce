import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createConversationWorkflow } from "../../../../workflows/chat/create-conversation"
import { PostStoreCreateConversationType } from "../validators"

export const POST = async (
  req: MedusaRequest<PostStoreCreateConversationType>,
  res: MedusaResponse
) => {
  const customerId = (req as any).auth_context?.actor_id || null

  const { result } = await createConversationWorkflow(req.scope).run({
    input: {
      customer_id: customerId,
      visitor_id: customerId ? undefined : (req.validatedBody.visitor_id || undefined),
    },
  })

  res.json({ conversation: result })
}
