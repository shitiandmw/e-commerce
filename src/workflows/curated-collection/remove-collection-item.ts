import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { CURATED_COLLECTION_MODULE } from "../../modules/curated-collection"
import CuratedCollectionModuleService from "../../modules/curated-collection/service"

type RemoveCollectionItemInput = {
  id: string
}

const dismissCollectionItemLinkStep = createStep(
  "dismiss-collection-item-link-step",
  async ({ id }: RemoveCollectionItemInput, { container }) => {
    const service: CuratedCollectionModuleService = container.resolve(
      CURATED_COLLECTION_MODULE
    )
    const item = await service.retrieveCollectionItem(id)

    const remoteLink = container.resolve("remoteLink") as any
    await remoteLink.dismiss({
      [CURATED_COLLECTION_MODULE]: {
        collection_item_id: id,
      },
      [Modules.PRODUCT]: {
        product_id: item.product_id,
      },
    })
    return new StepResponse(undefined, {
      item_id: id,
      product_id: item.product_id,
    })
  },
  async (
    data: { item_id: string; product_id: string },
    { container }
  ) => {
    const remoteLink = container.resolve("remoteLink") as any
    await remoteLink.create({
      [CURATED_COLLECTION_MODULE]: {
        collection_item_id: data.item_id,
      },
      [Modules.PRODUCT]: {
        product_id: data.product_id,
      },
    })
  }
)

const removeCollectionItemStep = createStep(
  "remove-collection-item-step",
  async ({ id }: RemoveCollectionItemInput, { container }) => {
    const service: CuratedCollectionModuleService = container.resolve(
      CURATED_COLLECTION_MODULE
    )
    const item = await service.retrieveCollectionItem(id)
    await service.deleteCollectionItems(id)
    return new StepResponse(id, item)
  },
  async (item: Record<string, unknown>, { container }) => {
    const service: CuratedCollectionModuleService = container.resolve(
      CURATED_COLLECTION_MODULE
    )
    await service.createCollectionItems(item as any)
  }
)

export const removeCollectionItemWorkflow = createWorkflow(
  "remove-collection-item",
  (input: RemoveCollectionItemInput) => {
    dismissCollectionItemLinkStep(input)
    const id = removeCollectionItemStep(input)
    return new WorkflowResponse(id)
  }
)
