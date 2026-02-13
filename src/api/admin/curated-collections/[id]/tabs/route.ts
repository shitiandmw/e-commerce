import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CURATED_COLLECTION_MODULE } from "../../../../../modules/curated-collection"
import CuratedCollectionModuleService from "../../../../../modules/curated-collection/service"
import { PostAdminCreateCollectionTabType } from "../../validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id: collection_id } = req.params
  const service: CuratedCollectionModuleService = req.scope.resolve(
    CURATED_COLLECTION_MODULE
  )

  const tabs = await service.listCollectionTabs(
    { collection_id },
    { order: { sort_order: "ASC" } }
  )

  res.json({ tabs })
}

export const POST = async (
  req: MedusaRequest<PostAdminCreateCollectionTabType>,
  res: MedusaResponse
) => {
  const { id: collection_id } = req.params
  const service: CuratedCollectionModuleService = req.scope.resolve(
    CURATED_COLLECTION_MODULE
  )

  const tab = await service.createCollectionTabs({
    ...req.validatedBody,
    collection_id,
  })

  res.json({ tab })
}
