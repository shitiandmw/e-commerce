import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { updatePageWorkflow } from "../../../../workflows/page/update-page"
import { deletePageWorkflow } from "../../../../workflows/page/delete-page"
import { PostAdminUpdatePageType } from "../validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const { id } = req.params

  const { data: [page] } = await query.graph({
    entity: "page",
    fields: ["*"],
    filters: { id },
  })

  if (!page) {
    res.status(404).json({ message: "Page not found" })
    return
  }

  res.json({ page })
}

export const POST = async (
  req: MedusaRequest<PostAdminUpdatePageType>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await updatePageWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody,
    },
  })

  res.json({ page: result })
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await deletePageWorkflow(req.scope).run({
    input: { id },
  })

  res.json({ id, object: "page", deleted: true })
}
