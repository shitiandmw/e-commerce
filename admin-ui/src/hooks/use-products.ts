"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"

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
  is_active?: boolean
  is_internal?: boolean
  rank?: number
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
  brand?: {
    id: string
    name: string
  } | Array<{
    id: string
    name: string
  }> | null
  custom_tags?: Array<{
    id: string
    name: string
    color?: string | null
    type: "badge" | "attribute"
  }>
  collection_id?: string | null
  type_id?: string | null
  weight?: number | null
  length?: number | null
  height?: number | null
  width?: number | null
  metadata?: Record<string, any> | null
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
      "+variants,+variants.prices,+options,+options.values,+images,*categories,*brand,*custom_tags"
  )

  return useQuery<ProductsResponse>({
    queryKey: ["products", { offset, limit, q, status, order }],
    queryFn: () =>
      adminFetch<ProductsResponse>(`/admin/products?${queryParams.toString()}`),
  })
}

export function useProduct(id: string) {
  return useQuery<{ product: Product }>({
    queryKey: ["product", id],
    queryFn: () =>
      adminFetch<{ product: Product }>(
        `/admin/products/${id}?fields=+variants,+variants.prices,+options,+options.values,+images,*categories,*brand,*custom_tags,+metadata`
      ),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, any>) =>
      adminFetch("/admin/products", {
        method: "POST",
        body: data,
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
      adminFetch(`/admin/products/${id}`, {
        method: "POST",
        body: data,
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
      adminFetch(`/admin/products/${id}`, {
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
      adminFetch<{ product_categories: ProductCategory[] }>(
        "/admin/product-categories",
        { params: { limit: "100", offset: "0" } }
      ),
  })
}

// Re-export full CRUD hooks from dedicated file
export {
  useProductCategories,
  useProductCategory,
  useCreateProductCategory,
  useUpdateProductCategory,
  useDeleteProductCategory,
  buildProductCategoryTree,
} from "./use-product-categories"

export function useLinkProductCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ category_id, product_id }: { category_id: string; product_id: string }) =>
      adminFetch(`/admin/product-categories/${category_id}/products`, {
        method: "POST",
        body: { add: [product_id] },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product"] })
    },
  })
}

export function useUnlinkProductCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ category_id, product_id }: { category_id: string; product_id: string }) =>
      adminFetch(`/admin/product-categories/${category_id}/products`, {
        method: "POST",
        body: { remove: [product_id] },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product"] })
    },
  })
}

export function useProductTypes() {
  return useQuery<{
    product_types: Array<{ id: string; value: string }>
  }>({
    queryKey: ["product-types"],
    queryFn: () =>
      adminFetch<{ product_types: Array<{ id: string; value: string }> }>(
        "/admin/product-types",
        { params: { limit: "100", offset: "0" } }
      ),
  })
}
