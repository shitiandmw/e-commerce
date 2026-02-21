import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CURATED_COLLECTION_MODULE } from "../../modules/curated-collection"
import CuratedCollectionModuleService from "../../modules/curated-collection/service"

type RemoveCollectionItemInput = {
  id: string
}

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
    const id = removeCollectionItemStep(input)
    return new WorkflowResponse(id)
  }
)
