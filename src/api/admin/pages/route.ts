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

  const filters: Record<string, any> = {}
  const status = req.query.status as string | undefined
  if (status) {
    filters.status = status
  }

  const { data: pages, metadata } = await query.graph({
    entity: "page",
    ...req.queryConfig,
    filters,
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
