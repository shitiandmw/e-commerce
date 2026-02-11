import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { TAG_MODULE } from "../../modules/tag"
import TagModuleService from "../../modules/tag/service"

type CreateTagInput = {
  name: string
  color?: string
  type?: "badge" | "attribute"
}

const createTagStep = createStep(
  "create-tag-step",
  async (input: CreateTagInput, { container }) => {
    const tagService: TagModuleService = container.resolve(TAG_MODULE)
    const tag = await tagService.createTags(input)
    return new StepResponse(tag, tag.id)
  },
  async (tagId: string, { container }) => {
    const tagService: TagModuleService = container.resolve(TAG_MODULE)
    await tagService.deleteTags(tagId)
  }
)

export const createTagWorkflow = createWorkflow(
  "create-tag",
  (input: CreateTagInput) => {
    const tag = createTagStep(input)
    return new WorkflowResponse(tag)
  }
)
