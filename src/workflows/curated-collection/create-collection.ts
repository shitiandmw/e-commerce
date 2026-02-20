import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CURATED_COLLECTION_MODULE } from "../../modules/curated-collection"
import CuratedCollectionModuleService from "../../modules/curated-collection/service"

type CreateCollectionInput = {
  name: string
  key: string
  description?: string
  sort_order?: number
  translations?: Record<string, any> | null
}

const createCollectionStep = createStep(
  "create-curated-collection-step",
  async (input: CreateCollectionInput, { container }) => {
    const service: CuratedCollectionModuleService = container.resolve(
      CURATED_COLLECTION_MODULE
    )
    const collection = await service.createCuratedCollections(input)
    return new StepResponse(collection, collection.id)
  },
  async (collectionId: string, { container }) => {
    const service: CuratedCollectionModuleService = container.resolve(
      CURATED_COLLECTION_MODULE
    )
    await service.deleteCuratedCollections(collectionId)
  }
)

export const createCuratedCollectionWorkflow = createWorkflow(
  "create-curated-collection",
  (input: CreateCollectionInput) => {
    const collection = createCollectionStep(input)
    return new WorkflowResponse(collection)
  }
)
