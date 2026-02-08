import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { BRAND_MODULE } from "../../modules/brand"

type LinkProductBrandInput = {
  product_id: string
  brand_id: string
}

const linkProductBrandStep = createStep(
  "link-product-brand-step",
  async ({ product_id, brand_id }: LinkProductBrandInput, { container }) => {
    const remoteLink = container.resolve("remoteLink") as any

    await remoteLink.create({
      [Modules.PRODUCT]: {
        product_id,
      },
      [BRAND_MODULE]: {
        brand_id,
      },
    })

    return new StepResponse(undefined, { product_id, brand_id })
  },
  async (
    { product_id, brand_id }: LinkProductBrandInput,
    { container }
  ) => {
    const remoteLink = container.resolve("remoteLink") as any
    await remoteLink.dismiss({
      [Modules.PRODUCT]: {
        product_id,
      },
      [BRAND_MODULE]: {
        brand_id,
      },
    })
  }
)

export const linkProductBrandWorkflow = createWorkflow(
  "link-product-brand",
  (input: LinkProductBrandInput) => {
    linkProductBrandStep(input)
    return new WorkflowResponse(undefined)
  }
)

// Unlink workflow
type UnlinkProductBrandInput = {
  product_id: string
  brand_id: string
}

const unlinkProductBrandStep = createStep(
  "unlink-product-brand-step",
  async ({ product_id, brand_id }: UnlinkProductBrandInput, { container }) => {
    const remoteLink = container.resolve("remoteLink") as any

    await remoteLink.dismiss({
      [Modules.PRODUCT]: {
        product_id,
      },
      [BRAND_MODULE]: {
        brand_id,
      },
    })

    return new StepResponse(undefined, { product_id, brand_id })
  },
  async (
    { product_id, brand_id }: UnlinkProductBrandInput,
    { container }
  ) => {
    const remoteLink = container.resolve("remoteLink") as any
    await remoteLink.create({
      [Modules.PRODUCT]: {
        product_id,
      },
      [BRAND_MODULE]: {
        brand_id,
      },
    })
  }
)

export const unlinkProductBrandWorkflow = createWorkflow(
  "unlink-product-brand",
  (input: UnlinkProductBrandInput) => {
    unlinkProductBrandStep(input)
    return new WorkflowResponse(undefined)
  }
)
