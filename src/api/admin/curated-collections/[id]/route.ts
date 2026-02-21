import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { updateCuratedCollectionWorkflow } from "../../../../workflows/curated-collection/update-collection"
import { deleteCuratedCollectionWorkflow } from "../../../../workflows/curated-collection/delete-collection"
import { PostAdminUpdateCuratedCollectionType } from "../validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const { id } = req.params

  const { data: [collection] } = await query.graph({
    entity: "curated_collection",
    fields: [
      "*",
      "tabs.*",
      "items.*",
    ],
    filters: { id },
  })

  if (!collection) {
    res.status(404).json({ message: "Curated collection not found" })
    return
  }

  // Batch fetch product details for items
  const productIds = new Set<string>()
  for (const item of (collection as any).items || []) {
    if (item.product_id) productIds.add(item.product_id)
  }

  if (productIds.size > 0) {
    const productService = req.scope.resolve(Modules.PRODUCT)
    const products = await productService.listProducts(
      { id: Array.from(productIds) },
      { select: ["id", "title", "handle", "thumbnail"] }
    )
    const productMap = new Map(products.map((p: any) => [p.id, p]))
    for (const item of (collection as any).items || []) {
      item.product = productMap.get(item.product_id) || null
    }
  }

  res.json({ collection })
}

export const POST = async (
  req: MedusaRequest<PostAdminUpdateCuratedCollectionType>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await updateCuratedCollectionWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody,
    },
  })

  res.json({ collection: result })
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await deleteCuratedCollectionWorkflow(req.scope).run({
    input: { id },
  })

  res.json({ id, object: "curated_collection", deleted: true })
}
