import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CURATED_COLLECTION_MODULE } from "../../modules/curated-collection"
import CuratedCollectionModuleService from "../../modules/curated-collection/service"

type UpdateCollectionInput = {
  id: string
  name?: string
  key?: string
  description?: string | null
  sort_order?: number
  translations?: Record<string, any> | null
}

const updateCollectionStep = createStep(
  "update-curated-collection-step",
  async (input: UpdateCollectionInput, { container }) => {
    const service: CuratedCollectionModuleService = container.resolve(
      CURATED_COLLECTION_MODULE
    )
    const existing = await service.retrieveCuratedCollection(input.id)
    const collection = await service.updateCuratedCollections(input)
    return new StepResponse(collection, existing)
  },
  async (previous: Record<string, unknown>, { container }) => {
    const service: CuratedCollectionModuleService = container.resolve(
      CURATED_COLLECTION_MODULE
    )
    await service.updateCuratedCollections(previous as any)
  }
)

export const updateCuratedCollectionWorkflow = createWorkflow(
  "update-curated-collection",
  (input: UpdateCollectionInput) => {
    const collection = updateCollectionStep(input)
    return new WorkflowResponse(collection)
  }
)
