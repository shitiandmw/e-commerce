import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { linkProductTagWorkflow } from "../../../../../workflows/tag/link-product-tag"
import { unlinkProductTagWorkflow } from "../../../../../workflows/tag/unlink-product-tag"
import { PostAdminLinkProductTagType } from "../../validators"

export const POST = async (
  req: MedusaRequest<PostAdminLinkProductTagType>,
  res: MedusaResponse
) => {
  const { id: tag_id } = req.params
  const { product_id } = req.validatedBody

  await linkProductTagWorkflow(req.scope).run({
    input: { product_id, tag_id },
  })

  res.json({ success: true })
}

export const DELETE = async (
  req: MedusaRequest<PostAdminLinkProductTagType>,
  res: MedusaResponse
) => {
  const { id: tag_id } = req.params
  const { product_id } = req.validatedBody

  await unlinkProductTagWorkflow(req.scope).run({
    input: { product_id, tag_id },
  })

  res.json({ success: true })
}
