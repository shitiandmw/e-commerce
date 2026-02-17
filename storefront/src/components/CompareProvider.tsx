"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

export interface CompareProduct {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  variants?: {
    id: string
    title: string
    prices?: {
      amount: number
      currency_code: string
    }[]
    options?: { id: string; value: string; option_id: string }[]
    manage_inventory?: boolean
    inventory_quantity?: number
  }[]
  brand?: { name: string } | null
  options?: { id: string; title: string; values?: { id: string; value: string }[] }[]
  description?: string | null
}

const MAX_COMPARE = 4
const STORAGE_KEY = "compare_products"

interface CompareContextValue {
  items: CompareProduct[]
  count: number
  isInCompare: (productId: string) => boolean
  addToCompare: (product: CompareProduct) => boolean
  removeFromCompare: (productId: string) => void
  clearCompare: () => void
  isFull: boolean
}

const CompareContext = createContext<CompareContextValue | null>(null)

export function useCompare() {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error("useCompare must be used within CompareProvider")
  return ctx
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareProduct[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setItems(parsed)
      }
    } catch {
      // ignore parse errors
    }
    setHydrated(true)
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated])

  const isInCompare = useCallback(
    (productId: string) => items.some((p) => p.id === productId),
    [items]
  )

  const addToCompare = useCallback(
    (product: CompareProduct): boolean => {
      if (items.some((p) => p.id === product.id)) return true
      if (items.length >= MAX_COMPARE) return false
      setItems((prev) => [...prev, product])
      return true
    },
    [items]
  )

  const removeFromCompare = useCallback((productId: string) => {
    setItems((prev) => prev.filter((p) => p.id !== productId))
  }, [])

  const clearCompare = useCallback(() => {
    setItems([])
  }, [])

  return (
    <CompareContext.Provider
      value={{
        items,
        count: items.length,
        isInCompare,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isFull: items.length >= MAX_COMPARE,
      }}
    >
      {children}
    </CompareContext.Provider>
  )
}
