import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../../modules/brand"
import { updateBrandWorkflow } from "../../../../workflows/brand/update-brand"
import { deleteBrandWorkflow } from "../../../../workflows/brand/delete-brand"
import { PostAdminUpdateBrandType } from "../validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const { id } = req.params

  const { data: [brand] } = await query.graph({
    entity: "brand",
    fields: ["*", "products.*"],
    filters: { id },
  })

  if (!brand) {
    res.status(404).json({ message: "Brand not found" })
    return
  }

  res.json({ brand })
}

export const POST = async (
  req: MedusaRequest<PostAdminUpdateBrandType>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await updateBrandWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody,
    },
  })

  res.json({ brand: result })
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await deleteBrandWorkflow(req.scope).run({
    input: { id },
  })

  res.json({ id, object: "brand", deleted: true })
}
