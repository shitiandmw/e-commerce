import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  linkProductBrandWorkflow,
  unlinkProductBrandWorkflow,
} from "../../../../../workflows/brand/link-product-brand"

type LinkProductBody = {
  product_id: string
}

export const POST = async (
  req: MedusaRequest<LinkProductBody>,
  res: MedusaResponse
) => {
  const { id: brand_id } = req.params
  const { product_id } = req.body

  await linkProductBrandWorkflow(req.scope).run({
    input: { product_id, brand_id },
  })

  res.json({ success: true })
}

export const DELETE = async (
  req: MedusaRequest<LinkProductBody>,
  res: MedusaResponse
) => {
  const { id: brand_id } = req.params
  const { product_id } = req.body

  await unlinkProductBrandWorkflow(req.scope).run({
    input: { product_id, brand_id },
  })

  res.json({ success: true })
}
