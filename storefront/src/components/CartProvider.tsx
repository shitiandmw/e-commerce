"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import {
  type Cart,
  getOrCreateCart,
  addToCart as addToCartApi,
  updateLineItem as updateLineItemApi,
  removeLineItem as removeLineItemApi,
  clearCart as clearCartApi,
  getCartId,
} from "@/lib/cart"

interface CartContextValue {
  cart: Cart | null
  itemCount: number
  loading: boolean
  addItem: (variantId: string, quantity?: number) => Promise<void>
  updateItem: (lineItemId: string, quantity: number) => Promise<void>
  removeItem: (lineItemId: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  const refreshCart = useCallback(async () => {
    if (!getCartId()) {
      setCart(null)
      return
    }
    try {
      const c = await getOrCreateCart()
      setCart(c)
    } catch {
      setCart(null)
    }
  }, [])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const addItem = useCallback(async (variantId: string, quantity = 1) => {
    setLoading(true)
    try {
      const updated = await addToCartApi(variantId, quantity)
      setCart(updated)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateItem = useCallback(async (lineItemId: string, quantity: number) => {
    setLoading(true)
    try {
      const updated = await updateLineItemApi(lineItemId, quantity)
      setCart(updated)
    } finally {
      setLoading(false)
    }
  }, [])

  const removeItem = useCallback(async (lineItemId: string) => {
    setLoading(true)
    try {
      const updated = await removeLineItemApi(lineItemId)
      setCart(updated)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearCartFn = useCallback(async () => {
    setLoading(true)
    try {
      const fresh = await clearCartApi()
      setCart(fresh)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <CartContext.Provider
      value={{ cart, itemCount, loading, addItem, updateItem, removeItem, clearCart: clearCartFn, refreshCart }}
    >
      {children}
    </CartContext.Provider>
  )
}
