import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { CURATED_COLLECTION_MODULE } from "../../modules/curated-collection"
import CuratedCollectionModuleService from "../../modules/curated-collection/service"

type DeleteCollectionInput = {
  id: string
}

const deleteCollectionItemsStep = createStep(
  "delete-collection-items-step",
  async ({ id }: DeleteCollectionInput, { container }) => {
    const service: CuratedCollectionModuleService = container.resolve(
      CURATED_COLLECTION_MODULE
    )
    // Retrieve items before deletion for compensation
    const items = await service.listCollectionItems({
      collection_id: id,
    })
    // Delete all items
    if (items.length > 0) {
      await service.deleteCollectionItems(items.map((i) => i.id))
    }
    return new StepResponse(undefined, items)
  },
  async (items: Record<string, unknown>[], { container }) => {
    if (!items || items.length === 0) return
    const service: CuratedCollectionModuleService = container.resolve(
      CURATED_COLLECTION_MODULE
    )
    for (const item of items) {
      await service.createCollectionItems(item as any)
    }
  }
)

const deleteCollectionTabsStep = createStep(
  "delete-collection-tabs-step",
  async ({ id }: DeleteCollectionInput, { container }) => {
    const service: CuratedCollectionModuleService = container.resolve(
      CURATED_COLLECTION_MODULE
    )
    const tabs = await service.listCollectionTabs({
      collection_id: id,
    })
    if (tabs.length > 0) {
      await service.deleteCollectionTabs(tabs.map((t) => t.id))
    }
    return new StepResponse(undefined, tabs)
  },
  async (tabs: Record<string, unknown>[], { container }) => {
    if (!tabs || tabs.length === 0) return
    const service: CuratedCollectionModuleService = container.resolve(
      CURATED_COLLECTION_MODULE
    )
    for (const tab of tabs) {
      await service.createCollectionTabs(tab as any)
    }
  }
)

const dismissCollectionLinksStep = createStep(
  "dismiss-collection-links-step",
  async ({ id }: DeleteCollectionInput, { container }) => {
    const service: CuratedCollectionModuleService = container.resolve(
      CURATED_COLLECTION_MODULE
    )
    const items = await service.listCollectionItems({
      collection_id: id,
    })
    if (items.length > 0) {
      const remoteLink = container.resolve("remoteLink") as any
      for (const item of items) {
        await remoteLink.dismiss({
          [CURATED_COLLECTION_MODULE]: {
            collection_item_id: item.id,
          },
          [Modules.PRODUCT]: {
            product_id: item.product_id,
          },
        })
      }
    }
    return new StepResponse(undefined)
  }
)

const deleteCollectionStep = createStep(
  "delete-curated-collection-step",
  async ({ id }: DeleteCollectionInput, { container }) => {
    const service: CuratedCollectionModuleService = container.resolve(
      CURATED_COLLECTION_MODULE
    )
    const collection = await service.retrieveCuratedCollection(id)
    await service.deleteCuratedCollections(id)
    return new StepResponse(id, collection)
  },
  async (collection: Record<string, unknown>, { container }) => {
    const service: CuratedCollectionModuleService = container.resolve(
      CURATED_COLLECTION_MODULE
    )
    await service.createCuratedCollections(collection as any)
  }
)

export const deleteCuratedCollectionWorkflow = createWorkflow(
  "delete-curated-collection",
  (input: DeleteCollectionInput) => {
    dismissCollectionLinksStep(input)
    deleteCollectionItemsStep(input)
    deleteCollectionTabsStep(input)
    const id = deleteCollectionStep(input)
    return new WorkflowResponse(id)
  }
)
