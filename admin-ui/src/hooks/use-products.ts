"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "@/lib/sdk"
import { getToken } from "@/lib/auth"

// Types
export interface ProductVariant {
  id: string
  title: string
  sku?: string | null
  prices?: Array<{
    id?: string
    amount: number
    currency_code: string
  }>
  options?: Array<{
    id?: string
    value: string
    option_id?: string
  }>
  inventory_quantity?: number
  manage_inventory?: boolean
  created_at?: string
  updated_at?: string
}

export interface ProductOption {
  id: string
  title: string
  values?: Array<{
    id?: string
    value: string
  }>
  product_id?: string
}

export interface ProductImage {
  id?: string
  url: string
}

export interface ProductCategory {
  id: string
  name: string
  handle?: string
  description?: string
  parent_category_id?: string | null
  parent_category?: ProductCategory | null
  category_children?: ProductCategory[]
  created_at?: string
  updated_at?: string
}

export interface Product {
  id: string
  title: string
  subtitle?: string | null
  description?: string | null
  handle?: string
  status: "draft" | "proposed" | "published" | "rejected"
  thumbnail?: string | null
  images?: ProductImage[]
  options?: ProductOption[]
  variants?: ProductVariant[]
  categories?: ProductCategory[]
  collection_id?: string | null
  type_id?: string | null
  weight?: number | null
  length?: number | null
  height?: number | null
  width?: number | null
  created_at: string
  updated_at: string
}

export interface ProductsResponse {
  products: Product[]
  count: number
  offset: number
  limit: number
}

export interface ProductsQueryParams {
  offset?: number
  limit?: number
  q?: string
  status?: string[]
  order?: string
  fields?: string
}

// Fetch function with auth
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getToken()
  const baseUrl =
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

  const res = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.message || `Request failed: ${res.status}`)
  }

  return res.json()
}

// Hooks
export function useProducts(params: ProductsQueryParams = {}) {
  const { offset = 0, limit = 20, q, status, order, fields } = params

  const queryParams = new URLSearchParams()
  queryParams.set("offset", String(offset))
  queryParams.set("limit", String(limit))
  if (q) queryParams.set("q", q)
  if (status && status.length > 0) {
    status.forEach((s) => queryParams.append("status[]", s))
  }
  if (order) queryParams.set("order", order)
  queryParams.set(
    "fields",
    fields ||
      "+variants,+variants.prices,+options,+options.values,+images,+categories"
  )

  return useQuery<ProductsResponse>({
    queryKey: ["products", { offset, limit, q, status, order }],
    queryFn: () => fetchWithAuth(`/admin/products?${queryParams.toString()}`),
  })
}

export function useProduct(id: string) {
  return useQuery<{ product: Product }>({
    queryKey: ["product", id],
    queryFn: () =>
      fetchWithAuth(
        `/admin/products/${id}?fields=+variants,+variants.prices,+options,+options.values,+images,+categories`
      ),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, any>) =>
      fetchWithAuth("/admin/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, any>) =>
      fetchWithAuth(`/admin/products/${id}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product", id] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      fetchWithAuth(`/admin/products/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}

export function useCategories() {
  return useQuery<{ product_categories: ProductCategory[] }>({
    queryKey: ["product-categories"],
    queryFn: () =>
      fetchWithAuth("/admin/product-categories?limit=100&offset=0"),
  })
}

export function useProductTypes() {
  return useQuery<{
    product_types: Array<{ id: string; value: string }>
  }>({
    queryKey: ["product-types"],
    queryFn: () => fetchWithAuth("/admin/product-types?limit=100&offset=0"),
  })
}
