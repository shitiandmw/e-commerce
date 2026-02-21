import { create } from "zustand"
import { type Product } from "@/lib/data/products"

export interface CartItem {
  product: Product
  quantity: number
}

interface CartState {
  items: CartItem[]
  addItem: (product: Product, qty?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, qty: number) => void
  clearCart: () => void
}

export const useCart = create<CartState>((set, get) => ({
  items: [],

  addItem: (product, qty = 1) => {
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + qty }
              : i
          ),
        }
      }
      return { items: [...state.items, { product, quantity: qty }] }
    })
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    }))
  },

  updateQuantity: (productId, qty) => {
    if (qty <= 0) {
      get().removeItem(productId)
      return
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId ? { ...i, quantity: qty } : i
      ),
    }))
  },

  clearCart: () => set({ items: [] }),
}))

/* derived helpers (pure functions, safe for SSR) */
export function selectTotalItems(state: CartState) {
  return state.items.reduce((sum, i) => sum + i.quantity, 0)
}
export function selectTotalPrice(state: CartState) {
  return state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
}
