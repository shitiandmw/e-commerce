import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createCuratedCollectionWorkflow } from "../../../workflows/curated-collection/create-collection"
import { PostAdminCreateCuratedCollectionType } from "./validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")

  const { data: collections, metadata } = await query.graph({
    entity: "curated_collection",
    ...req.queryConfig,
  })

  res.json({
    collections,
    count: metadata?.count || collections.length,
    offset: metadata?.skip || 0,
    limit: metadata?.take || collections.length,
  })
}

export const POST = async (
  req: MedusaRequest<PostAdminCreateCuratedCollectionType>,
  res: MedusaResponse
) => {
  const { result } = await createCuratedCollectionWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.json({ collection: result })
}
