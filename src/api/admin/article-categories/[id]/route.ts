import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { updateArticleCategoryWorkflow } from "../../../../workflows/article-category/update-article-category"
import { deleteArticleCategoryWorkflow } from "../../../../workflows/article-category/delete-article-category"
import { PostAdminUpdateArticleCategoryType } from "../validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const { id } = req.params

  const { data: [article_category] } = await query.graph({
    entity: "article_category",
    fields: ["*", "parent.*", "children.*"],
    filters: { id },
  })

  if (!article_category) {
    res.status(404).json({ message: "Article category not found" })
    return
  }

  res.json({ article_category })
}

export const POST = async (
  req: MedusaRequest<PostAdminUpdateArticleCategoryType>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await updateArticleCategoryWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody,
    },
  })

  res.json({ article_category: result })
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await deleteArticleCategoryWorkflow(req.scope).run({
    input: { id },
  })

  res.json({ id, object: "article_category", deleted: true })
}
