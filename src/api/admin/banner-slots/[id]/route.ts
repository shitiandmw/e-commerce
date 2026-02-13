import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { updateBannerSlotWorkflow } from "../../../../workflows/banner/update-banner-slot"
import { deleteBannerSlotWorkflow } from "../../../../workflows/banner/delete-banner-slot"
import { PostAdminUpdateBannerSlotType } from "../validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const { id } = req.params

  const { data: [banner_slot] } = await query.graph({
    entity: "banner_slot",
    fields: ["*", "items.*"],
    filters: { id },
  })

  if (!banner_slot) {
    res.status(404).json({ message: "Banner slot not found" })
    return
  }

  res.json({ banner_slot })
}

export const POST = async (
  req: MedusaRequest<PostAdminUpdateBannerSlotType>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await updateBannerSlotWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody,
    },
  })

  res.json({ banner_slot: result })
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await deleteBannerSlotWorkflow(req.scope).run({
    input: { id },
  })

  res.json({ id, object: "banner_slot", deleted: true })
}
