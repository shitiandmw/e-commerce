import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CURATED_COLLECTION_MODULE } from "../../../../../../modules/curated-collection"
import CuratedCollectionModuleService from "../../../../../../modules/curated-collection/service"
import { PostAdminUpdateCollectionTabType } from "../../../validators"

export const POST = async (
  req: MedusaRequest<PostAdminUpdateCollectionTabType>,
  res: MedusaResponse
) => {
  const { tabId } = req.params
  const service: CuratedCollectionModuleService = req.scope.resolve(
    CURATED_COLLECTION_MODULE
  )

  const tab = await service.updateCollectionTabs({
    id: tabId,
    ...req.validatedBody,
  })

  res.json({ tab })
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { tabId } = req.params
  const service: CuratedCollectionModuleService = req.scope.resolve(
    CURATED_COLLECTION_MODULE
  )

  await service.deleteCollectionTabs(tabId)

  res.json({ id: tabId, object: "collection_tab", deleted: true })
}
