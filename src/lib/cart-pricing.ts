import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  acquireLockStep,
  refreshCartItemsWorkflow,
  releaseLockStep,
} from "@medusajs/medusa/core-flows"
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  getStoreProductSalePrices,
  type PublicProductSalePrice,
} from "./product-sale-pricing"

type CartCompareAtItem = {
  id: string
  is_custom_price?: boolean | null
  compare_at_unit_price?: unknown
}

type LineItemUpdate = {
  selector: { id: string }
  data: { compare_at_unit_price: null }
}

type CartSaleTimingItem = {
  id: string
  product_id?: string | null
  variant_id?: string | null
  unit_price: unknown
  is_custom_price?: boolean | null
}

type CartForSaleTiming = {
  currency_code?: string | null
  items?: CartSaleTimingItem[] | null
  [key: string]: unknown
}

export function getCompareAtPriceResetUpdates(
  items: CartCompareAtItem[]
): LineItemUpdate[] {
  return items
    .filter(
      (item) =>
        !item.is_custom_price && item.compare_at_unit_price != null
    )
    .map((item) => ({
      selector: { id: item.id },
      data: { compare_at_unit_price: null },
    }))
}

export function getCartItemSaleEnd(
  item: CartSaleTimingItem,
  currencyCode: string | null | undefined,
  salePrices: PublicProductSalePrice[]
): string | null {
  if (item.is_custom_price || !item.variant_id) return null
  const unitPrice = Number(item.unit_price)
  if (!Number.isFinite(unitPrice)) return null
  const salePrice = salePrices.find((candidate) =>
    candidate.variant_id === item.variant_id &&
    candidate.status === "active" &&
    candidate.ends_at !== null &&
    candidate.amount === unitPrice &&
    candidate.currency_code.toLowerCase() === currencyCode?.toLowerCase()
  )
  return salePrice?.ends_at ?? null
}

export async function enrichCartWithSaleTiming<T extends CartForSaleTiming>(
  container: MedusaContainer,
  cart: T,
  now = new Date()
): Promise<T & { pricing_refreshed_at: string }> {
  const productIds = Array.from(new Set(
    (cart.items ?? [])
      .map((item) => item.product_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0)
  ))
  const salePrices = (await Promise.all(
    productIds.map((productId) =>
      getStoreProductSalePrices(container, productId, now).catch(() => [])
    )
  )).flat()

  return {
    ...cart,
    pricing_refreshed_at: now.toISOString(),
    items: (cart.items ?? []).map((item) => ({
      ...item,
      sale_ends_at: getCartItemSaleEnd(
        item,
        cart.currency_code,
        salePrices
      ),
    })),
  } as T & { pricing_refreshed_at: string }
}

const resetStandardCompareAtPricesStep = createStep(
  "reset-standard-cart-compare-at-prices",
  async ({ cart_id }: { cart_id: string }, { container }) => {
    const cartModule = container.resolve(Modules.CART)
    const items = await cartModule.listLineItems(
      { cart_id },
      { select: ["id", "is_custom_price", "compare_at_unit_price"] }
    )
    const updates = getCompareAtPriceResetUpdates(items)
    if (!updates.length) {
      return new StepResponse([], [])
    }

    const previousItems = items.filter((item) =>
      updates.some((update) => update.selector.id === item.id)
    )
    await cartModule.updateLineItems(updates as any)
    return new StepResponse(updates, previousItems)
  },
  async (previousItems: CartCompareAtItem[] | undefined, { container }) => {
    if (!previousItems?.length) return
    const cartModule = container.resolve(Modules.CART)
    await cartModule.updateLineItems(
      previousItems.map((item) => ({
        selector: { id: item.id },
        data: { compare_at_unit_price: item.compare_at_unit_price },
      })) as any
    )
  }
)

const refreshCartPricesWorkflow = createWorkflow(
  "refresh-cart-prices-with-current-compare-at",
  (input: { cart_id: string }) => {
    const lock = acquireLockStep({
      key: input.cart_id,
      timeout: 2,
      ttl: 10,
    })
    const resetInput = transform({ input, lock }, ({ input }) => input)
    const resetItems = resetStandardCompareAtPricesStep(resetInput)
    const refreshInput = transform(
      { input, resetItems },
      ({ input }) => ({
        cart_id: input.cart_id,
        force_refresh: true,
      })
    )
    const refreshedCart = refreshCartItemsWorkflow.runAsStep({
      input: refreshInput,
    })
    const releaseInput = transform(
      { input, refreshedCart },
      ({ input }) => ({ key: input.cart_id })
    )
    releaseLockStep(releaseInput)

    return new WorkflowResponse(refreshedCart)
  }
)

export async function refreshCartPrices(
  container: MedusaContainer,
  cartId: string
) {
  return refreshCartPricesWorkflow(container).run({
    input: { cart_id: cartId },
  })
}
