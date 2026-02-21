import { create } from "zustand"

/**
 * Unified cart product type that works with both mock and Medusa products.
 * When adding from mock Product, pass the Product directly (has `id`, `price`, `name`, `image`).
 * When adding from MedusaProduct, pass a normalized object with these fields.
 */
export interface CartProduct {
  id: string
  /** Display name — mock uses `name`, Medusa uses `title` */
  name?: string
  title?: string
  handle?: string
  /** Image URL — mock uses `image`, Medusa uses `thumbnail` */
  image?: string
  thumbnail?: string | null
  price: number
  currency_code?: string
  brandEn?: string
  packSize?: number
  variant_id?: string
  variant_title?: string
}

export interface CartItem {
  product: CartProduct
  quantity: number
}

interface CartState {
  items: CartItem[]
  addItem: (product: CartProduct, qty?: number) => void
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

/* helper to get display name from cart product */
export function getCartProductName(p: CartProduct): string {
  return p.title || p.name || ""
}

/* helper to get display image from cart product */
export function getCartProductImage(p: CartProduct): string {
  return p.image || p.thumbnail || "/images/placeholder.jpg"
}
