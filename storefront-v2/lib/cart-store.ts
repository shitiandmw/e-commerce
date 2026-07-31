import { create } from "zustand"
import {
  type Cart,
  type CartLineItem,
  getOrCreateCart,
  addToCart,
  updateLineItem,
  removeLineItem,
  applyPromoCode,
  removePromoCode,
  clearCart as clearCartApi,
  refreshCartPrices,
} from "./cart"
import {
  didStoredCartPriceChange,
  snapshotCartPrices,
  type CartPriceSnapshot,
} from "./cart-price-change"
import { mergeCartSaleTiming } from "./cart-sale-timing"

const CART_PRICE_SNAPSHOT_PREFIX = "medusa_cart_price_snapshot:"

interface CartState {
  cart: Cart | null
  loading: boolean
  initialized: boolean
  error: string | null
  priceChanged: boolean
  acknowledgePriceChange: () => void
  initCart: () => Promise<void>
  refreshPrices: () => Promise<void>
  addItem: (variantId: string, qty?: number) => Promise<void>
  updateItem: (lineItemId: string, qty: number) => Promise<void>
  removeItem: (lineItemId: string) => Promise<void>
  applyPromotion: (code: string) => Promise<Cart>
  removePromotion: (code: string) => Promise<Cart>
  clear: () => Promise<void>
}

export const useCart = create<CartState>((set) => {
  const commitCart = (cart: Cart, detectPriceChange = false) => {
    let changed = false
    if (typeof window !== "undefined") {
      const key = `${CART_PRICE_SNAPSHOT_PREFIX}${cart.id}`
      let previous: CartPriceSnapshot | null = null
      try {
        const stored = localStorage.getItem(key)
        previous = stored ? JSON.parse(stored) : null
      } catch {
        previous = null
      }
      changed = detectPriceChange && didStoredCartPriceChange(previous, cart)
      try {
        localStorage.setItem(key, JSON.stringify(snapshotCartPrices(cart)))
      } catch {
        // Storage can be unavailable in privacy-restricted browser sessions.
      }
    }
    set((state) => ({
      cart: mergeCartSaleTiming(state.cart, cart),
      priceChanged: state.priceChanged || changed,
    }))
  }

  return {
    cart: null,
    loading: false,
    initialized: false,
    error: null,
    priceChanged: false,
    acknowledgePriceChange: () => set({ priceChanged: false }),

    initCart: async () => {
      set({ loading: true, error: null })
      try {
        const cart = await getOrCreateCart()
        commitCart(cart, true)
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Failed to load cart" })
        throw error
      } finally {
        set({ loading: false, initialized: true })
      }
    },

    refreshPrices: async () => {
      set({ loading: true, error: null })
      try {
        const cart = await refreshCartPrices()
        commitCart(cart, true)
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Failed to refresh prices" })
        throw error
      } finally {
        set({ loading: false })
      }
    },

    addItem: async (variantId, qty = 1) => {
      set({ loading: true })
      try {
        const cart = await addToCart(variantId, qty)
        commitCart(cart)
      } finally {
        set({ loading: false })
      }
    },

    updateItem: async (lineItemId, qty) => {
      if (qty <= 0) {
        await useCart.getState().removeItem(lineItemId)
        return
      }
      set({ loading: true })
      try {
        const cart = await updateLineItem(lineItemId, qty)
        commitCart(cart)
      } finally {
        set({ loading: false })
      }
    },

    removeItem: async (lineItemId) => {
      set({ loading: true })
      try {
        const cart = await removeLineItem(lineItemId)
        commitCart(cart)
      } finally {
        set({ loading: false })
      }
    },

    applyPromotion: async (code) => {
      set({ loading: true })
      try {
        const cart = await applyPromoCode(code)
        commitCart(cart)
        return cart
      } finally {
        set({ loading: false })
      }
    },

    removePromotion: async (code) => {
      set({ loading: true })
      try {
        const cart = await removePromoCode(code)
        commitCart(cart)
        return cart
      } finally {
        set({ loading: false })
      }
    },

    clear: async () => {
      set({ loading: true })
      try {
        const cart = await clearCartApi()
        commitCart(cart)
      } finally {
        set({ loading: false })
      }
    },
  }
})

/* derived selectors */
export function selectTotalItems(state: CartState) {
  return state.cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0
}

export function selectTotalPrice(state: CartState) {
  return state.cart?.item_total ?? state.cart?.total ?? 0
}

/* compat helpers for checkout page (temporary) */
export function getCartProductName(item: CartLineItem): string {
  return item.product_title || item.variant?.product?.title || item.title || ""
}

export function getCartProductImage(item: CartLineItem): string {
  return item.thumbnail || item.variant?.product?.thumbnail || "/images/placeholder.jpg"
}
