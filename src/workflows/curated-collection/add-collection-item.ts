import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CURATED_COLLECTION_MODULE } from "../../modules/curated-collection"
import CuratedCollectionModuleService from "../../modules/curated-collection/service"

type AddCollectionItemInput = {
  collection_id: string
  product_id: string
  tab_id?: string | null
  sort_order?: number
}

const addCollectionItemStep = createStep(
  "add-collection-item-step",
  async (input: AddCollectionItemInput, { container }) => {
    const service: CuratedCollectionModuleService = container.resolve(
      CURATED_COLLECTION_MODULE
    )
    const item = await service.createCollectionItems({
      collection_id: input.collection_id,
      product_id: input.product_id,
      tab_id: input.tab_id || null,
      sort_order: input.sort_order ?? 0,
    })
    return new StepResponse(item, item.id)
  },
  async (itemId: string, { container }) => {
    const service: CuratedCollectionModuleService = container.resolve(
      CURATED_COLLECTION_MODULE
    )
    await service.deleteCollectionItems(itemId)
  }
)

export const addCollectionItemWorkflow = createWorkflow(
  "add-collection-item",
  (input: AddCollectionItemInput) => {
    const item = addCollectionItemStep(input)
    return new WorkflowResponse(item)
  }
)
