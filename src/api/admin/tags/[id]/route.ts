import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { updateTagWorkflow } from "../../../../workflows/tag/update-tag"
import { deleteTagWorkflow } from "../../../../workflows/tag/delete-tag"
import { PostAdminUpdateTagType } from "../validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const { id } = req.params

  const { data: [tag] } = await query.graph({
    entity: "custom_tag",
    fields: ["*", "products.*"],
    filters: { id },
  })

  if (!tag) {
    res.status(404).json({ message: "Tag not found" })
    return
  }

  res.json({ tag })
}

export const POST = async (
  req: MedusaRequest<PostAdminUpdateTagType>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await updateTagWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody,
    },
  })

  res.json({ tag: result })
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await deleteTagWorkflow(req.scope).run({
    input: { id },
  })

  res.json({ id, object: "tag", deleted: true })
}
