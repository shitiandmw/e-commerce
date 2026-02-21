import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
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

const linkCollectionItemProductStep = createStep(
  "link-collection-item-product-step",
  async (input: { item_id: string; product_id: string }, { container }) => {
    const remoteLink = container.resolve("remoteLink") as any
    await remoteLink.create({
      [CURATED_COLLECTION_MODULE]: {
        collection_item_id: input.item_id,
      },
      [Modules.PRODUCT]: {
        product_id: input.product_id,
      },
    })
    return new StepResponse(undefined, {
      item_id: input.item_id,
      product_id: input.product_id,
    })
  },
  async (
    data: { item_id: string; product_id: string },
    { container }
  ) => {
    const remoteLink = container.resolve("remoteLink") as any
    await remoteLink.dismiss({
      [CURATED_COLLECTION_MODULE]: {
        collection_item_id: data.item_id,
      },
      [Modules.PRODUCT]: {
        product_id: data.product_id,
      },
    })
  }
)

export const addCollectionItemWorkflow = createWorkflow(
  "add-collection-item",
  (input: AddCollectionItemInput) => {
    const item = addCollectionItemStep(input)

    const linkInput = transform({ item, input }, (data) => ({
      item_id: data.item.id,
      product_id: data.input.product_id,
    }))

    linkCollectionItemProductStep(linkInput)
    return new WorkflowResponse(item)
  }
)
