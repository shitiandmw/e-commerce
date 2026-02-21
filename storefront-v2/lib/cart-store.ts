import { create } from "zustand"
import {
  type Cart,
  type CartLineItem,
  getOrCreateCart,
  addToCart,
  updateLineItem,
  removeLineItem,
  clearCart as clearCartApi,
} from "./cart"

interface CartState {
  cart: Cart | null
  loading: boolean
  initCart: () => Promise<void>
  addItem: (variantId: string, qty?: number) => Promise<void>
  updateItem: (lineItemId: string, qty: number) => Promise<void>
  removeItem: (lineItemId: string) => Promise<void>
  clear: () => Promise<void>
}

export const useCart = create<CartState>((set) => ({
  cart: null,
  loading: false,

  initCart: async () => {
    set({ loading: true })
    try {
      const cart = await getOrCreateCart()
      set({ cart })
    } catch {
      set({ cart: null })
    } finally {
      set({ loading: false })
    }
  },

  addItem: async (variantId, qty = 1) => {
    set({ loading: true })
    try {
      const cart = await addToCart(variantId, qty)
      set({ cart })
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
      set({ cart })
    } finally {
      set({ loading: false })
    }
  },

  removeItem: async (lineItemId) => {
    set({ loading: true })
    try {
      const cart = await removeLineItem(lineItemId)
      set({ cart })
    } finally {
      set({ loading: false })
    }
  },

  clear: async () => {
    set({ loading: true })
    try {
      const cart = await clearCartApi()
      set({ cart })
    } finally {
      set({ loading: false })
    }
  },
}))

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
