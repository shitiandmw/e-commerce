import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  getTotalVariantAvailability,
  getVariantAvailability,
} from "@medusajs/utils"
import { RESTOCK_DEMAND_MODULE } from "../modules/restock-demand"

export type RestockVariantSnapshot = {
  id: string
  product_id: string
  product_title: string
  variant_title: string | null
  sku: string | null
  specification: Array<{ name: string; value: string }>
  manage_inventory: boolean
  available_quantity: number | null
}

export function buildRestockIdentity(customerId?: string | null, visitorId?: string | null) {
  if (customerId) return `customer:${customerId}`
  if (visitorId) return `visitor:${visitorId}`
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "visitor_id is required for anonymous restock requests"
  )
}

export function isVariantOutOfStock(
  manageInventory: boolean | null | undefined,
  inventoryQuantity: number | null | undefined
) {
  return manageInventory !== false && (inventoryQuantity == null || inventoryQuantity <= 0)
}

export async function getRestockVariantSnapshot(
  container: any,
  variantId: string,
  options: { salesChannelId?: string } = {}
): Promise<RestockVariantSnapshot | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product_variant",
    fields: [
      "id",
      "title",
      "sku",
      "product_id",
      "manage_inventory",
      "product.id",
      "product.title",
      "options.value",
      "options.option.title",
    ],
    filters: { id: variantId },
  })

  const variant = data?.[0] as any
  if (!variant) return null

  const availability = options.salesChannelId
    ? await getVariantAvailability(query, {
        variant_ids: [variantId],
        sales_channel_id: options.salesChannelId,
      })
    : await getTotalVariantAvailability(query, {
        variant_ids: [variantId],
      })

  return {
    id: variant.id,
    product_id: variant.product_id || variant.product?.id,
    product_title: variant.product?.title || "",
    variant_title: variant.title || null,
    sku: variant.sku || null,
    specification: (variant.options || []).map((option: any) => ({
      name: option.option?.title || "",
      value: option.value || "",
    })).filter((option: { name: string; value: string }) => option.name || option.value),
    manage_inventory: variant.manage_inventory !== false,
    available_quantity: availability[variantId]?.availability ?? null,
  }
}

export async function reconcilePendingRestockRounds(container: any) {
  const service = container.resolve(RESTOCK_DEMAND_MODULE)
  const pending = await service.listRestockRounds({ status: "pending" })
  const restockedAt = new Date()
  let archived = 0

  for (const round of pending) {
    const variant = await getRestockVariantSnapshot(container, round.variant_id)
    if (variant && !isVariantOutOfStock(variant.manage_inventory, variant.available_quantity)) {
      await service.updateRestockRounds({
        id: round.id,
        status: "restocked",
        restocked_at: restockedAt,
      })
      archived += 1
    }
  }

  return archived
}
