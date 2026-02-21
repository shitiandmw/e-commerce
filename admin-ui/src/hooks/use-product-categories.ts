"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"
import type { ProductCategory } from "./use-products"

export type { ProductCategory }

export interface ProductCategoriesResponse {
  product_categories: ProductCategory[]
  count: number
  offset: number
  limit: number
}

/** Build a flat list sorted by tree hierarchy with depth info */
export function buildProductCategoryTree(
  categories: ProductCategory[]
): { category: ProductCategory; depth: number }[] {
  const result: { category: ProductCategory; depth: number }[] = []
  const childrenMap = new Map<string | null, ProductCategory[]>()

  for (const cat of categories) {
    const pid = cat.parent_category_id ?? null
    if (!childrenMap.has(pid)) childrenMap.set(pid, [])
    childrenMap.get(pid)!.push(cat)
  }

  function walk(parentId: string | null, depth: number) {
    const children = childrenMap.get(parentId) ?? []
    for (const child of children.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))) {
      result.push({ category: child, depth })
      walk(child.id, depth + 1)
    }
  }

  walk(null, 0)
  return result
}

// ─── Hooks ──────────────────────────────────────────────

export function useProductCategories() {
  return useQuery<ProductCategoriesResponse>({
    queryKey: ["product-categories"],
    queryFn: () =>
      adminFetch<ProductCategoriesResponse>("/admin/product-categories", {
        params: {
          limit: "100",
          offset: "0",
          fields: "id,name,handle,description,is_active,is_internal,rank,parent_category_id,parent_category.*,category_children.*,created_at,updated_at",
        },
      }),
  })
}

export function useProductCategory(id: string) {
  return useQuery<{ product_category: ProductCategory }>({
    queryKey: ["product-category", id],
    queryFn: () =>
      adminFetch<{ product_category: ProductCategory }>(
        `/admin/product-categories/${id}?fields=id,name,handle,description,is_active,is_internal,rank,parent_category_id,parent_category.*,category_children.*,created_at,updated_at`
      ),
    enabled: !!id,
  })
}

export function useCreateProductCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      name: string
      handle?: string
      description?: string
      parent_category_id?: string | null
      is_active?: boolean
      is_internal?: boolean
      rank?: number
    }) =>
      adminFetch<{ product_category: ProductCategory }>(
        "/admin/product-categories",
        { method: "POST", body: data }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] })
    },
  })
}

export function useUpdateProductCategory(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      name?: string
      handle?: string
      description?: string
      parent_category_id?: string | null
      is_active?: boolean
      is_internal?: boolean
      rank?: number
    }) =>
      adminFetch<{ product_category: ProductCategory }>(
        `/admin/product-categories/${id}`,
        { method: "POST", body: data }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] })
      queryClient.invalidateQueries({ queryKey: ["product-category", id] })
    },
  })
}

export function useDeleteProductCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/product-categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] })
    },
  })
}
