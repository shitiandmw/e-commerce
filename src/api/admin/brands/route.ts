import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createBrandWorkflow } from "../../../workflows/brand/create-brand"
import { PostAdminCreateBrandType } from "./validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")

  const { data: brands, metadata } = await query.graph({
    entity: "brand",
    ...req.queryConfig,
  })

  res.json({
    brands,
    count: metadata?.count || brands.length,
    offset: metadata?.skip || 0,
    limit: metadata?.take || brands.length,
  })
}

export const POST = async (
  req: MedusaRequest<PostAdminCreateBrandType>,
  res: MedusaResponse
) => {
  const { result } = await createBrandWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.json({ brand: result })
}
