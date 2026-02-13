import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createArticleCategoryWorkflow } from "../../../workflows/article-category/create-article-category"
import { PostAdminCreateArticleCategoryType } from "./validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")

  const { data: article_categories, metadata } = await query.graph({
    entity: "article_category",
    ...req.queryConfig,
  })

  res.json({
    article_categories,
    count: metadata?.count || article_categories.length,
    offset: metadata?.skip || 0,
    limit: metadata?.take || article_categories.length,
  })
}

export const POST = async (
  req: MedusaRequest<PostAdminCreateArticleCategoryType>,
  res: MedusaResponse
) => {
  const { result } = await createArticleCategoryWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.json({ article_category: result })
}
