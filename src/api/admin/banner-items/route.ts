import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createBannerItemWorkflow } from "../../../workflows/banner/create-banner-item"
import { PostAdminCreateBannerItemType } from "./validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")

  const filters: Record<string, unknown> = {}
  if (req.query.slot_id) {
    filters.slot_id = req.query.slot_id
  }

  const { data: banner_items, metadata } = await query.graph({
    entity: "banner_item",
    ...req.queryConfig,
    filters,
  })

  res.json({
    banner_items,
    count: metadata?.count || banner_items.length,
    offset: metadata?.skip || 0,
    limit: metadata?.take || banner_items.length,
  })
}

export const POST = async (
  req: MedusaRequest<PostAdminCreateBannerItemType>,
  res: MedusaResponse
) => {
  const { result } = await createBannerItemWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.json({ banner_item: result })
}
