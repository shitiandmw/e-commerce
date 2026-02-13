import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { TAG_MODULE } from "../../modules/tag"

type LinkProductTagInput = {
  product_id: string
  tag_id: string
}

const linkProductTagStep = createStep(
  "link-product-tag-step",
  async ({ product_id, tag_id }: LinkProductTagInput, { container }) => {
    const remoteLink = container.resolve("remoteLink") as any

    await remoteLink.create({
      [Modules.PRODUCT]: {
        product_id,
      },
      [TAG_MODULE]: {
        custom_tag_id: tag_id,
      },
    })

    return new StepResponse(undefined, { product_id, tag_id })
  },
  async (
    { product_id, tag_id }: LinkProductTagInput,
    { container }
  ) => {
    const remoteLink = container.resolve("remoteLink") as any
    await remoteLink.dismiss({
      [Modules.PRODUCT]: {
        product_id,
      },
      [TAG_MODULE]: {
        custom_tag_id: tag_id,
      },
    })
  }
)

export const linkProductTagWorkflow = createWorkflow(
  "link-product-tag",
  (input: LinkProductTagInput) => {
    linkProductTagStep(input)
    return new WorkflowResponse(undefined)
  }
)
