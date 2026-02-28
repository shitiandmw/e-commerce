import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")

  const filters: Record<string, any> = {}
  const status = req.query.status as string | undefined
  const q = req.query.q as string | undefined

  if (status) {
    filters.status = status
  }

  if (q) {
    filters.last_message_preview = { $like: `%${q}%` }
  }

  const { data: conversations, metadata } = await query.graph({
    entity: "conversation",
    ...req.queryConfig,
    filters,
  })

  res.json({
    conversations,
    count: metadata?.count || conversations.length,
    offset: metadata?.skip || 0,
    limit: metadata?.take || conversations.length,
  })
}
