import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createPageWorkflow } from "../../../workflows/page/create-page"
import { PostAdminCreatePageType } from "./validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")

  const { data: pages, metadata } = await query.graph({
    entity: "page",
    ...req.queryConfig,
    filters: {
      ...req.filterableFields,
    },
  })

  res.json({
    pages,
    count: metadata?.count || pages.length,
    offset: metadata?.skip || 0,
    limit: metadata?.take || pages.length,
  })
}

export const POST = async (
  req: MedusaRequest<PostAdminCreatePageType>,
  res: MedusaResponse
) => {
  const { result } = await createPageWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.json({ page: result })
}
