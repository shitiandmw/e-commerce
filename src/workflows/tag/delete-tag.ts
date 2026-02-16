import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { TAG_MODULE } from "../../modules/tag"
import TagModuleService from "../../modules/tag/service"

type DeleteTagInput = {
  id: string
}

const deleteTagStep = createStep(
  "delete-tag-step",
  async ({ id }: DeleteTagInput, { container }) => {
    const tagService: TagModuleService = container.resolve(TAG_MODULE)
    const tag = await tagService.retrieveCustomTag(id)
    await tagService.deleteCustomTags(id)
    return new StepResponse(id, tag)
  },
  async (tag: Record<string, unknown>, { container }) => {
    const tagService: TagModuleService = container.resolve(TAG_MODULE)
    await tagService.createCustomTags(tag as any)
  }
)

const dismissTagLinksStep = createStep(
  "dismiss-tag-links-step",
  async ({ id }: DeleteTagInput, { container }) => {
    const remoteLink = container.resolve("remoteLink") as any
    try {
      await remoteLink.dismiss({
        [TAG_MODULE]: {
          custom_tag_id: id,
        },
      })
    } catch (e) {
      // Links may not exist, safe to ignore
    }
    return new StepResponse(undefined)
  }
)

export const deleteTagWorkflow = createWorkflow(
  "delete-tag",
  (input: DeleteTagInput) => {
    dismissTagLinksStep(input)
    const id = deleteTagStep(input)
    return new WorkflowResponse(id)
  }
)
