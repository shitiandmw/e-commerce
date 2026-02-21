import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { CURATED_COLLECTION_MODULE } from "../../../../../modules/curated-collection"
import CuratedCollectionModuleService from "../../../../../modules/curated-collection/service"
import { addCollectionItemWorkflow } from "../../../../../workflows/curated-collection/add-collection-item"
import { PostAdminAddCollectionItemType } from "../../validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id: collection_id } = req.params
  const tab_id = req.query.tab_id as string | undefined

  const filters: Record<string, unknown> = { collection_id }
  if (tab_id) {
    filters.tab_id = tab_id
  }

  const service: CuratedCollectionModuleService = req.scope.resolve(
    CURATED_COLLECTION_MODULE
  )

  const items = await service.listCollectionItems(
    filters,
    {
      order: { sort_order: "ASC" },
      relations: [],
    }
  )

  if (items.length === 0) {
    res.json({ items: [] })
    return
  }

  // Batch fetch product details
  const productIds = new Set<string>()
  for (const item of items) {
    if (item.product_id) productIds.add(item.product_id)
  }

  const productMap = new Map<string, any>()
  if (productIds.size > 0) {
    const productService = req.scope.resolve(Modules.PRODUCT)
    const products = await productService.listProducts(
      { id: Array.from(productIds) },
      { select: ["id", "title", "handle", "thumbnail"] }
    )
    for (const p of products) {
      productMap.set(p.id, p)
    }
  }

  const enrichedItems = items.map((item) => ({
    ...item,
    product: productMap.get(item.product_id) || null,
  }))

  res.json({ items: enrichedItems })
}

export const POST = async (
  req: MedusaRequest<PostAdminAddCollectionItemType>,
  res: MedusaResponse
) => {
  const { id: collection_id } = req.params

  const { result } = await addCollectionItemWorkflow(req.scope).run({
    input: {
      collection_id,
      ...req.validatedBody,
    },
  })

  res.json({ item: result })
}
