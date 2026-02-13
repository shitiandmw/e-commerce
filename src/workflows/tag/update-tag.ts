import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { TAG_MODULE } from "../../modules/tag"
import TagModuleService from "../../modules/tag/service"

type UpdateTagInput = {
  id: string
  name?: string
  color?: string | null
  type?: "badge" | "attribute"
}

const updateTagStep = createStep(
  "update-tag-step",
  async (input: UpdateTagInput, { container }) => {
    const tagService: TagModuleService = container.resolve(TAG_MODULE)
    const existing = await tagService.retrieveCustomTag(input.id)
    const tag = await tagService.updateCustomTags(input)
    return new StepResponse(tag, existing)
  },
  async (previous: Record<string, unknown>, { container }) => {
    const tagService: TagModuleService = container.resolve(TAG_MODULE)
    await tagService.updateCustomTags(previous as any)
  }
)

export const updateTagWorkflow = createWorkflow(
  "update-tag",
  (input: UpdateTagInput) => {
    const tag = updateTagStep(input)
    return new WorkflowResponse(tag)
  }
)
