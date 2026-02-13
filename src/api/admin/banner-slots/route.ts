import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createBannerSlotWorkflow } from "../../../workflows/banner/create-banner-slot"
import { PostAdminCreateBannerSlotType } from "./validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")

  const { data: banner_slots, metadata } = await query.graph({
    entity: "banner_slot",
    ...req.queryConfig,
  })

  res.json({
    banner_slots,
    count: metadata?.count || banner_slots.length,
    offset: metadata?.skip || 0,
    limit: metadata?.take || banner_slots.length,
  })
}

export const POST = async (
  req: MedusaRequest<PostAdminCreateBannerSlotType>,
  res: MedusaResponse
) => {
  const { result } = await createBannerSlotWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.json({ banner_slot: result })
}
