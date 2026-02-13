import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { updateArticleWorkflow } from "../../../../workflows/article/update-article"
import { deleteArticleWorkflow } from "../../../../workflows/article/delete-article"
import { PostAdminUpdateArticleType } from "../validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const { id } = req.params

  const { data: [article] } = await query.graph({
    entity: "article",
    fields: ["*", "category.*"],
    filters: { id },
  })

  if (!article) {
    res.status(404).json({ message: "Article not found" })
    return
  }

  res.json({ article })
}

export const POST = async (
  req: MedusaRequest<PostAdminUpdateArticleType>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await updateArticleWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody,
    },
  })

  res.json({ article: result })
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await deleteArticleWorkflow(req.scope).run({
    input: { id },
  })

  res.json({ id, object: "article", deleted: true })
}
