import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { updateBannerItemWorkflow } from "../../../../workflows/banner/update-banner-item"
import { deleteBannerItemWorkflow } from "../../../../workflows/banner/delete-banner-item"
import { PostAdminUpdateBannerItemType } from "../validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const { id } = req.params

  const { data: [banner_item] } = await query.graph({
    entity: "banner_item",
    fields: ["*", "slot.*"],
    filters: { id },
  })

  if (!banner_item) {
    res.status(404).json({ message: "Banner item not found" })
    return
  }

  res.json({ banner_item })
}

export const POST = async (
  req: MedusaRequest<PostAdminUpdateBannerItemType>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await updateBannerItemWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody,
    },
  })

  res.json({ banner_item: result })
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await deleteBannerItemWorkflow(req.scope).run({
    input: { id },
  })

  res.json({ id, object: "banner_item", deleted: true })
}
