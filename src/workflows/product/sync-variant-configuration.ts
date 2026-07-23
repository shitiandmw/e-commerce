import { Modules } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  acquireLockStep,
  createProductVariantsWorkflow,
  deleteProductOptionsWorkflow,
  deleteProductVariantsWorkflow,
  releaseLockStep,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  prepareProductVariantConfiguration,
  type PreparedProductVariantConfiguration,
  type SyncProductVariantConfigurationInput,
} from "../../lib/product-variant-configuration"
import { RESTOCK_DEMAND_MODULE } from "../../modules/restock-demand"

type ProductOptionSnapshot = {
  id: string
  product_id?: string | null
  title: string
  values?: Array<{ id: string; value: string }>
}

type ProductOptionsCompensation = {
  previous: ProductOptionSnapshot[]
  created_ids: string[]
}

const toOptionUpsert = (option: ProductOptionSnapshot) => ({
  id: option.id,
  product_id: option.product_id || undefined,
  title: option.title,
  values: (option.values || []).map((value) => ({
    id: value.id,
    value: value.value,
  })),
})

const prepareVariantConfigurationStep = createStep(
  "prepare-product-variant-configuration",
  async (input: SyncProductVariantConfigurationInput, { container }) => {
    const prepared = await prepareProductVariantConfiguration(container, input)
    return new StepResponse(prepared)
  }
)

const ensureProductOptionsStep = createStep(
  "ensure-product-variant-configuration-options",
  async (input: PreparedProductVariantConfiguration, { container }) => {
    const productService = container.resolve(Modules.PRODUCT) as any
    const current = (await productService.listProductOptions(
      { product_id: input.product_id },
      { relations: ["values"] }
    )) as ProductOptionSnapshot[]
    const currentById = new Map(current.map((option) => [option.id, option]))
    const upserts = input.desired_options.map((option) => {
      const existing = option.id ? currentById.get(option.id) : undefined
      const values = Array.from(
        new Set([...(existing?.values || []).map((value) => value.value), ...option.values])
      )
      return {
        id: option.id,
        product_id: input.product_id,
        title: option.title,
        values,
      }
    })
    const result = await productService.upsertProductOptions(upserts)
    const resultArray = Array.isArray(result) ? result : [result]
    const createdIds = resultArray
      .filter((option: ProductOptionSnapshot) => !currentById.has(option.id))
      .map((option: ProductOptionSnapshot) => option.id)

    return new StepResponse(resultArray, {
      previous: current.filter((option) =>
        input.desired_options.some((desired) => desired.id === option.id)
      ),
      created_ids: createdIds,
    } satisfies ProductOptionsCompensation)
  },
  async (compensation: ProductOptionsCompensation | undefined, { container }) => {
    if (!compensation) return
    const productService = container.resolve(Modules.PRODUCT) as any
    if (compensation.created_ids.length > 0) {
      await productService.softDeleteProductOptions(compensation.created_ids)
    }
    if (compensation.previous.length > 0) {
      await productService.upsertProductOptions(
        compensation.previous.map(toOptionUpsert)
      )
    }
  }
)

const finalizeProductOptionsStep = createStep(
  "finalize-product-variant-configuration-options",
  async (input: PreparedProductVariantConfiguration, { container }) => {
    const productService = container.resolve(Modules.PRODUCT) as any
    const current = (await productService.listProductOptions(
      { product_id: input.product_id },
      { relations: ["values"] }
    )) as ProductOptionSnapshot[]
    const currentById = new Map(current.map((option) => [option.id, option]))
    const currentByTitle = new Map(current.map((option) => [option.title, option]))
    const targets = input.desired_options.map((desired) => {
      const existing =
        (desired.id && currentById.get(desired.id)) || currentByTitle.get(desired.title)
      if (!existing) throw new Error(`Product option ${desired.title} was not created`)
      return {
        id: existing.id,
        product_id: input.product_id,
        title: desired.title,
        values: desired.values,
      }
    })
    await productService.upsertProductOptions(targets)
    return new StepResponse(targets, {
      previous: current,
      created_ids: [],
    } satisfies ProductOptionsCompensation)
  },
  async (compensation: ProductOptionsCompensation | undefined, { container }) => {
    if (!compensation?.previous.length) return
    const productService = container.resolve(Modules.PRODUCT) as any
    await productService.upsertProductOptions(
      compensation.previous.map(toOptionUpsert)
    )
  }
)

const closeStoppedRestockRoundsStep = createStep(
  "close-stopped-product-variant-restock-rounds",
  async (variantIds: string[], { container }) => {
    if (variantIds.length === 0) return new StepResponse([], [])
    const service = container.resolve(RESTOCK_DEMAND_MODULE) as any
    const rounds = await service.listRestockRounds({
      variant_id: variantIds,
      status: "pending",
    })
    if (rounds.length > 0) {
      await service.updateRestockRounds(
        rounds.map((round: any) => ({ id: round.id, status: "discontinued" }))
      )
    }
    return new StepResponse(rounds, rounds.map((round: any) => round.id))
  },
  async (roundIds: string[] | undefined, { container }) => {
    if (!roundIds?.length) return
    const service = container.resolve(RESTOCK_DEMAND_MODULE) as any
    await service.updateRestockRounds(
      roundIds.map((id) => ({ id, status: "pending" }))
    )
  }
)

export const syncProductVariantConfigurationWorkflow = createWorkflow(
  "sync-product-variant-configuration",
  (input: SyncProductVariantConfigurationInput) => {
    const lockInput = transform(input, (data) => ({
      key: `product-variant-configuration:${data.product_id}`,
      timeout: 10,
      ttl: 60,
    }))
    const lock = acquireLockStep(lockInput)
    const lockedInput = transform({ input, lock }, ({ input }) => input)
    const prepared = prepareVariantConfigurationStep(lockedInput)

    const deleteVariantInput = transform(prepared, (data) => ({
      ids: data.delete_variant_ids,
    }))
    const deletedVariants = when(
      "delete-configured-product-variants",
      { deleteVariantInput },
      ({ deleteVariantInput }) => deleteVariantInput.ids.length > 0
    ).then(() =>
      deleteProductVariantsWorkflow.runAsStep({ input: deleteVariantInput })
    )
    const deleteOptionInput = transform(
      { prepared, deletedVariants },
      ({ prepared }) => ({ ids: prepared.delete_option_ids })
    )
    const deletedOptions = when(
      "delete-configured-product-options",
      { deleteOptionInput },
      ({ deleteOptionInput }) => deleteOptionInput.ids.length > 0
    ).then(() =>
      deleteProductOptionsWorkflow.runAsStep({ input: deleteOptionInput })
    )
    const ensureOptionsInput = transform(
      { prepared, deletedOptions },
      ({ prepared }) => prepared
    )
    const ensuredOptions = ensureProductOptionsStep(ensureOptionsInput)

    const updateVariantsInput = transform(
      { prepared, ensuredOptions },
      ({ prepared }) => ({ product_variants: prepared.update_variants })
    )
    const updatedVariants = when(
      "update-configured-product-variants",
      { updateVariantsInput },
      ({ updateVariantsInput }) => updateVariantsInput.product_variants.length > 0
    ).then(() =>
      updateProductVariantsWorkflow.runAsStep({ input: updateVariantsInput })
    )
    const createVariantsInput = transform(
      { prepared, updatedVariants },
      ({ prepared }) => ({ product_variants: prepared.create_variants })
    )
    const createdVariants = when(
      "create-configured-product-variants",
      { createVariantsInput },
      ({ createVariantsInput }) => createVariantsInput.product_variants.length > 0
    ).then(() =>
      createProductVariantsWorkflow.runAsStep({ input: createVariantsInput })
    )

    const finalizeOptionsInput = transform(
      { prepared, createdVariants },
      ({ prepared }) => prepared
    )
    const finalizedOptions = finalizeProductOptionsStep(finalizeOptionsInput)
    const stoppedVariantIds = transform(
      { prepared, finalizedOptions },
      ({ prepared }) => prepared.stopped_variant_ids
    )
    const closedRestockRounds = closeStoppedRestockRoundsStep(stoppedVariantIds)
    const releaseInput = transform(
      { input, closedRestockRounds },
      ({ input }) => ({
        key: `product-variant-configuration:${input.product_id}`,
      })
    )
    releaseLockStep(releaseInput)

    return new WorkflowResponse({
      product_id: prepared.product_id,
      created_variants: createdVariants,
      updated_variants: updatedVariants,
      deleted_variant_ids: prepared.delete_variant_ids,
    })
  }
)
