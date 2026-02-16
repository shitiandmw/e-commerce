"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"

// Types
export interface Brand {
  id: string
  name: string
  description?: string | null
  logo_url?: string | null
  created_at: string
  updated_at: string
  products?: Array<{
    id: string
    title: string
    status: string
    thumbnail?: string | null
  }>
}

export interface BrandsResponse {
  brands: Brand[]
  count: number
  offset: number
  limit: number
}

export interface BrandsQueryParams {
  offset?: number
  limit?: number
  q?: string
}

// Hooks
export function useBrands(params: BrandsQueryParams = {}) {
  const { offset = 0, limit = 20, q } = params

  return useQuery<BrandsResponse>({
    queryKey: ["brands", { offset, limit, q }],
    queryFn: () => {
      const queryParams: Record<string, string> = {
        offset: String(offset),
        limit: String(limit),
      }
      if (q) queryParams.q = q
      return adminFetch<BrandsResponse>("/admin/brands", {
        params: queryParams,
      })
    },
  })
}

export function useBrand(id: string) {
  return useQuery<{ brand: Brand }>({
    queryKey: ["brand", id],
    queryFn: () => adminFetch<{ brand: Brand }>(`/admin/brands/${id}`),
    enabled: !!id,
  })
}

export function useCreateBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; description?: string; logo_url?: string }) =>
      adminFetch<{ brand: Brand }>("/admin/brands", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
    },
  })
}

export function useUpdateBrand(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      name?: string
      description?: string | null
      logo_url?: string | null
    }) =>
      adminFetch<{ brand: Brand }>(`/admin/brands/${id}`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      queryClient.invalidateQueries({ queryKey: ["brand", id] })
    },
  })
}

export function useDeleteBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/brands/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
    },
  })
}

export function useLinkProductBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      brand_id,
      product_id,
    }: {
      brand_id: string
      product_id: string
    }) =>
      adminFetch(`/admin/brands/${brand_id}/products`, {
        method: "POST",
        body: { product_id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      queryClient.invalidateQueries({ queryKey: ["brand"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product"] })
    },
  })
}

export function useUnlinkProductBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      brand_id,
      product_id,
    }: {
      brand_id: string
      product_id: string
    }) =>
      adminFetch(`/admin/brands/${brand_id}/products`, {
        method: "DELETE",
        body: { product_id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      queryClient.invalidateQueries({ queryKey: ["brand"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product"] })
    },
  })
}
