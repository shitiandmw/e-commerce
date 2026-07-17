import type { Context } from "@medusajs/framework/types"
import {
  InjectTransactionManager,
  MedusaContext,
  MedusaError,
  MedusaService,
} from "@medusajs/framework/utils"
import { ProductShippingOption } from "./models/product-shipping-option"
import { ShippingOptionPickupLocation } from "./models/shipping-option-pickup-location"

const normalizeOptionIds = (optionIds: string[]) =>
  Array.from(new Set(optionIds.map((id) => id.trim()).filter(Boolean)))

class ShippingAvailabilityModuleService extends MedusaService({
  ProductShippingOption,
  ShippingOptionPickupLocation,
}) {
  @InjectTransactionManager()
  async replaceProductShippingOptions(
    productId: string,
    optionIds: string[],
    @MedusaContext() sharedContext: Context<any> = {}
  ) {
    const normalizedIds = normalizeOptionIds(optionIds)
    if (normalizedIds.length === 0) {
      throw this.createReplacementError(
        "SHIPPING_OPTION_REQUIRED",
        "At least one shipping option is required."
      )
    }

    await sharedContext.transactionManager.execute(
      "select pg_advisory_xact_lock(hashtextextended(?, 0))",
      [`product_shipping_options:${productId}`]
    )

    const existing = await this.listProductShippingOptions(
      { product_id: productId },
      {},
      sharedContext
    )
    const next = new Set(normalizedIds)
    const current = new Set(existing.map((link) => link.shipping_option_id))
    const toDelete = existing.filter((link) => !next.has(link.shipping_option_id))
    const toCreate = normalizedIds.filter((id) => !current.has(id))

    if (toDelete.length > 0) {
      await this.deleteProductShippingOptions(
        toDelete.map((link) => link.id),
        sharedContext
      )
    }
    if (toCreate.length > 0) {
      await this.createProductShippingOptions(
        toCreate.map((shippingOptionId) => ({
          product_id: productId,
          shipping_option_id: shippingOptionId,
        })),
        sharedContext
      )
    }

    const finalLinks = await this.listProductShippingOptions(
      { product_id: productId },
      {},
      sharedContext
    )
    const finalIds = normalizeOptionIds(
      finalLinks.map((link) => link.shipping_option_id)
    ).sort()
    const expectedIds = [...normalizedIds].sort()
    if (JSON.stringify(finalIds) !== JSON.stringify(expectedIds)) {
      throw this.createReplacementError(
        "PRODUCT_SHIPPING_OPTIONS_SYNC_CONFLICT",
        "The product shipping options changed concurrently. Retry the update.",
        { product_id: productId, expected_ids: expectedIds, actual_ids: finalIds }
      )
    }

    return finalLinks
  }

  private createReplacementError(
    code: string,
    message: string,
    details: Record<string, unknown> = {}
  ) {
    const error = new MedusaError(MedusaError.Types.CONFLICT, message, code)
    Object.assign(error, { shipping_code: code, status: 409, details })
    return error
  }
}

export default ShippingAvailabilityModuleService
