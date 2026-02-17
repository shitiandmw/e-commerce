"use client"

const CART_ID_KEY = "medusa_cart_id"

export function getCartId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(CART_ID_KEY)
}

export function setCartId(id: string) {
  localStorage.setItem(CART_ID_KEY, id)
}

export function removeCartId() {
  localStorage.removeItem(CART_ID_KEY)
}

export interface CartLineItem {
  id: string
  title: string
  subtitle?: string | null
  quantity: number
  unit_price: number
  total: number
  variant_id: string
  variant?: {
    id: string
    title: string
    product?: {
      id: string
      title: string
      handle: string
      thumbnail?: string | null
    }
  }
  thumbnail?: string | null
  product_title?: string
  product_handle?: string
  variant_title?: string
}

export interface Cart {
  id: string
  items?: CartLineItem[]
  total?: number
  subtotal?: number
  tax_total?: number
  shipping_total?: number
  discount_total?: number
  item_total?: number
  currency_code?: string
  region_id?: string
}

const FIELDS = "fields=*items,*items.variant,*items.variant.product"

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `API error: ${res.status}`)
  }
  return res.json()
}

export async function getOrCreateCart(): Promise<Cart> {
  const cartId = getCartId()
  if (cartId) {
    try {
      const { cart } = await apiFetch<{ cart: Cart }>(
        `/api/cart/${cartId}?${FIELDS}`
      )
      return cart
    } catch {
      removeCartId()
    }
  }
  const { regions } = await apiFetch<{ regions: { id: string }[] }>("/api/regions")
  const regionId = regions?.[0]?.id
  const { cart } = await apiFetch<{ cart: Cart }>("/api/cart", {
    method: "POST",
    body: JSON.stringify(regionId ? { region_id: regionId } : {}),
  })
  setCartId(cart.id)
  return cart
}

export async function addToCart(variantId: string, quantity: number = 1): Promise<Cart> {
  const cart = await getOrCreateCart()
  const { cart: updated } = await apiFetch<{ cart: Cart }>(
    `/api/cart/${cart.id}/line-items?${FIELDS}`,
    {
      method: "POST",
      body: JSON.stringify({ variant_id: variantId, quantity }),
    }
  )
  return updated
}

export async function updateLineItem(lineItemId: string, quantity: number): Promise<Cart> {
  const cartId = getCartId()
  if (!cartId) throw new Error("No cart found")
  const { cart } = await apiFetch<{ cart: Cart }>(
    `/api/cart/${cartId}/line-items/${lineItemId}?${FIELDS}`,
    {
      method: "POST",
      body: JSON.stringify({ quantity }),
    }
  )
  return cart
}

export async function removeLineItem(lineItemId: string): Promise<Cart> {
  const cartId = getCartId()
  if (!cartId) throw new Error("No cart found")
  const { parent: cart } = await apiFetch<{ parent: Cart }>(
    `/api/cart/${cartId}/line-items/${lineItemId}?${FIELDS}`,
    { method: "DELETE" }
  )
  return cart
}

export async function clearCart(): Promise<Cart> {
  removeCartId()
  const { regions } = await apiFetch<{ regions: { id: string }[] }>("/api/regions")
  const regionId = regions?.[0]?.id
  const { cart } = await apiFetch<{ cart: Cart }>("/api/cart", {
    method: "POST",
    body: JSON.stringify(regionId ? { region_id: regionId } : {}),
  })
  setCartId(cart.id)
  return cart
}
