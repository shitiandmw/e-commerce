import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { updateCuratedCollectionWorkflow } from "../../../../workflows/curated-collection/update-collection"
import { deleteCuratedCollectionWorkflow } from "../../../../workflows/curated-collection/delete-collection"
import { PostAdminUpdateCuratedCollectionType } from "../validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const { id } = req.params

  const { data: [collection] } = await query.graph({
    entity: "curated_collection",
    fields: [
      "*",
      "tabs.*",
      "items.*",
      "items.product.*",
    ],
    filters: { id },
  })

  if (!collection) {
    res.status(404).json({ message: "Curated collection not found" })
    return
  }

  res.json({ collection })
}

export const POST = async (
  req: MedusaRequest<PostAdminUpdateCuratedCollectionType>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await updateCuratedCollectionWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody,
    },
  })

  res.json({ collection: result })
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await deleteCuratedCollectionWorkflow(req.scope).run({
    input: { id },
  })

  res.json({ id, object: "curated_collection", deleted: true })
}
