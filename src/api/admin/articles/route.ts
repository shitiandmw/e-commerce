import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createArticleWorkflow } from "../../../workflows/article/create-article"
import { PostAdminCreateArticleType } from "./validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")

  const filters: Record<string, any> = {}

  const categoryId = req.query.category_id as string | undefined
  const status = req.query.status as string | undefined
  const q = req.query.q as string | undefined

  if (status) {
    filters.status = status
  }

  if (q) {
    filters.title = { $like: `%${q}%` }
  }

  if (categoryId) {
    filters.category_id = categoryId
  }

  const { data: articles, metadata } = await query.graph({
    entity: "article",
    ...req.queryConfig,
    filters,
  })

  res.json({
    articles,
    count: metadata?.count || articles.length,
    offset: metadata?.skip || 0,
    limit: metadata?.take || articles.length,
  })
}

export const POST = async (
  req: MedusaRequest<PostAdminCreateArticleType>,
  res: MedusaResponse
) => {
  const { result } = await createArticleWorkflow(req.scope).run({
    input: req.validatedBody as any,
  })

  res.json({ article: result })
}
