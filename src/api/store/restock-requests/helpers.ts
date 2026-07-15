import { MedusaError } from "@medusajs/framework/utils"
import {
  buildRestockIdentity,
  getRestockVariantSnapshot,
  isVariantOutOfStock,
} from "../../../lib/restock-demand"
import { RESTOCK_DEMAND_MODULE } from "../../../modules/restock-demand"

type CustomerSnapshot = {
  id: string
  email?: string | null
  first_name?: string | null
  last_name?: string | null
}

async function getCustomerSnapshot(container: any, customerId: string) {
  const query = container.resolve("query")
  const { data } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name", "last_name"],
    filters: { id: customerId },
  })
  return (data?.[0] || { id: customerId }) as CustomerSnapshot
}

async function getPendingRound(service: any, variantId: string) {
  const rounds = await service.listRestockRounds(
    { variant_id: variantId, status: "pending" },
    { relations: ["requests"] }
  )
  return rounds[0] || null
}

async function ensurePendingRound(
  container: any,
  variantId: string,
  salesChannelId: string
) {
  const service = container.resolve(RESTOCK_DEMAND_MODULE)
  let round = await getPendingRound(service, variantId)
  const variant = await getRestockVariantSnapshot(container, variantId, {
    salesChannelId,
  })
  if (!variant) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product variant not found")
  }
  if (!isVariantOutOfStock(variant.manage_inventory, variant.available_quantity)) {
    if (round) {
      await service.updateRestockRounds({
        id: round.id,
        status: "restocked",
        restocked_at: new Date(),
      })
    }
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This SKU is currently in stock")
  }
  if (round) return round

  try {
    await service.createRestockRounds({
      variant_id: variant.id,
      product_id: variant.product_id,
      product_title: variant.product_title,
      variant_title: variant.variant_title,
      sku: variant.sku,
      specification: variant.specification,
      status: "pending",
    })
  } catch (error) {
    round = await getPendingRound(service, variantId)
    if (!round) throw error
    return round
  }

  return getPendingRound(service, variantId)
}

export async function getRestockRequestStatus(
  container: any,
  input: {
    variant_id: string
    sales_channel_id: string
    customer_id?: string | null
    visitor_id?: string | null
  }
) {
  const service = container.resolve(RESTOCK_DEMAND_MODULE)
  const identityKey = buildRestockIdentity(input.customer_id, input.visitor_id)
  const round = await getPendingRound(service, input.variant_id)
  if (!round) return { requested: false, round_id: null, requester_count: 0 }

  const variant = await getRestockVariantSnapshot(container, input.variant_id, {
    salesChannelId: input.sales_channel_id,
  })
  if (variant && !isVariantOutOfStock(variant.manage_inventory, variant.available_quantity)) {
    await service.updateRestockRounds({
      id: round.id,
      status: "restocked",
      restocked_at: new Date(),
    })
    return { requested: false, round_id: null, requester_count: 0 }
  }

  return {
    requested: round.requests.some((request: any) => request.identity_key === identityKey),
    round_id: round.id,
    requester_count: round.requests.length,
  }
}

export async function createRestockRequest(
  container: any,
  input: {
    variant_id: string
    sales_channel_id: string
    customer_id?: string | null
    visitor_id?: string | null
  }
) {
  const service = container.resolve(RESTOCK_DEMAND_MODULE)
  const identityKey = buildRestockIdentity(input.customer_id, input.visitor_id)
  const round = await ensurePendingRound(
    container,
    input.variant_id,
    input.sales_channel_id
  )
  const existing = round.requests.find((request: any) => request.identity_key === identityKey)

  if (!existing) {
    const customer = input.customer_id
      ? await getCustomerSnapshot(container, input.customer_id)
      : null

    try {
      await service.createRestockRequesters({
        round_id: round.id,
        identity_key: identityKey,
        customer_id: input.customer_id || null,
        visitor_id: input.customer_id ? null : input.visitor_id || null,
        customer_email: customer?.email || null,
        customer_first_name: customer?.first_name || null,
        customer_last_name: customer?.last_name || null,
      })
    } catch (error) {
      const duplicate = await service.listRestockRequesters({
        round_id: round.id,
        identity_key: identityKey,
      })
      if (!duplicate.length) throw error
    }
  }

  const refreshed = await service.retrieveRestockRound(round.id, {
    relations: ["requests"],
  })

  return {
    requested: true,
    round_id: refreshed.id,
    requester_count: refreshed.requests.length,
  }
}

export function getRestockSalesChannelId(req: {
  publishable_key_context?: { sales_channel_ids?: string[] }
}) {
  const salesChannelIds = req.publishable_key_context?.sales_channel_ids || []
  if (salesChannelIds.length !== 1) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Restock availability requires exactly one sales channel in the publishable API key"
    )
  }
  return salesChannelIds[0]
}
