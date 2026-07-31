import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const CHAT_CONVERSATION_ORDER = {
  last_message_at: "desc nulls last",
  created_at: "desc",
  id: "desc",
} as const

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const queryConfig = req.queryConfig || {}
  const pagination = (queryConfig as any).pagination || {}

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
    ...queryConfig,
    filters,
    pagination: {
      ...pagination,
      order: CHAT_CONVERSATION_ORDER,
    },
  })

  res.json({
    conversations,
    count: metadata?.count ?? conversations.length,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? conversations.length,
  })
}
