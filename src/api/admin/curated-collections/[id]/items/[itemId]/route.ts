import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CURATED_COLLECTION_MODULE } from "../../../../../../modules/curated-collection"
import CuratedCollectionModuleService from "../../../../../../modules/curated-collection/service"
import { removeCollectionItemWorkflow } from "../../../../../../workflows/curated-collection/remove-collection-item"
import { PostAdminUpdateCollectionItemType } from "../../../validators"

export const POST = async (
  req: MedusaRequest<PostAdminUpdateCollectionItemType>,
  res: MedusaResponse
) => {
  const { itemId } = req.params
  const service: CuratedCollectionModuleService = req.scope.resolve(
    CURATED_COLLECTION_MODULE
  )

  const item = await service.updateCollectionItems({
    id: itemId,
    ...req.validatedBody,
  })

  res.json({ item })
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { itemId } = req.params

  await removeCollectionItemWorkflow(req.scope).run({
    input: { id: itemId },
  })

  res.json({ id: itemId, object: "collection_item", deleted: true })
}
