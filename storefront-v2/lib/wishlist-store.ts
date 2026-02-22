import { create } from "zustand"
import { getToken } from "./auth"

export interface WishlistItem {
  id: string
  customer_id: string
  product_id: string
  created_at: string
}

interface WishlistState {
  items: WishlistItem[]
  loading: boolean
  fetchWishlist: () => Promise<void>
  addItem: (productId: string) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  removeByProductId: (productId: string) => Promise<void>
  isInWishlist: (productId: string) => boolean
  clear: () => void
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export const useWishlist = create<WishlistState>((set, get) => ({
  items: [],
  loading: false,

  fetchWishlist: async () => {
    const token = getToken()
    if (!token) {
      set({ items: [] })
      return
    }
    set({ loading: true })
    try {
      const res = await fetch("/api/wishlist", {
        headers: authHeaders(),
      })
      if (!res.ok) {
        set({ items: [] })
        return
      }
      const data = await res.json()
      set({ items: data.wishlist_items || [] })
    } catch {
      set({ items: [] })
    } finally {
      set({ loading: false })
    }
  },

  addItem: async (productId: string) => {
    set({ loading: true })
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ product_id: productId }),
      })
      if (!res.ok) throw new Error("Failed to add")
      const data = await res.json()
      const newItem = data.wishlist_item
      set((state) => {
        const exists = state.items.some((i) => i.product_id === productId)
        if (exists) return state
        return { items: [newItem, ...state.items] }
      })
    } finally {
      set({ loading: false })
    }
  },

  removeItem: async (itemId: string) => {
    set({ loading: true })
    try {
      await fetch(`/api/wishlist/${itemId}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
      set((state) => ({
        items: state.items.filter((i) => i.id !== itemId),
      }))
    } finally {
      set({ loading: false })
    }
  },

  removeByProductId: async (productId: string) => {
    const item = get().items.find((i) => i.product_id === productId)
    if (item) {
      await get().removeItem(item.id)
    }
  },

  isInWishlist: (productId: string) => {
    return get().items.some((i) => i.product_id === productId)
  },

  clear: () => set({ items: [] }),
}))
