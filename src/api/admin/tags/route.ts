import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createTagWorkflow } from "../../../workflows/tag/create-tag"
import { PostAdminCreateTagType } from "./validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")

  const { data: tags, metadata } = await query.graph({
    entity: "custom_tag",
    ...req.queryConfig,
  })

  res.json({
    tags,
    count: metadata?.count || tags.length,
    offset: metadata?.skip || 0,
    limit: metadata?.take || tags.length,
  })
}

export const POST = async (
  req: MedusaRequest<PostAdminCreateTagType>,
  res: MedusaResponse
) => {
  const { result } = await createTagWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.json({ tag: result })
}
