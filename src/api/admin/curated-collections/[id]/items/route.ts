import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
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

  const query = req.scope.resolve("query")

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

  // Fetch with product info via query graph
  const itemIds = items.map((i) => i.id)
  if (itemIds.length === 0) {
    res.json({ items: [] })
    return
  }

  const { data: enrichedItems } = await query.graph({
    entity: "collection_item",
    fields: ["*", "product.*"],
    filters: { id: itemIds },
  })

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
