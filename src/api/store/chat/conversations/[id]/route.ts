import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

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

  res.json({ conversation })
}
