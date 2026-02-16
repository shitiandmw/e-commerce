"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"

// Types
export interface Page {
  id: string
  title: string
  slug: string
  content?: string | null
  status: "draft" | "published"
  template?: string | null
  sort_order: number
  translations?: Record<string, { title?: string; content?: string }> | null
  seo?: { meta_title?: string; meta_description?: string; og_image?: string; keywords?: string } | null
  created_at: string
  updated_at: string
}

export interface PagesResponse {
  pages: Page[]
  count: number
  offset: number
  limit: number
}

export interface PagesQueryParams {
  offset?: number
  limit?: number
  status?: string
}

// Hooks
export function usePages(params: PagesQueryParams = {}) {
  const { offset = 0, limit = 20, status } = params

  return useQuery<PagesResponse>({
    queryKey: ["pages", { offset, limit, status }],
    queryFn: () => {
      const queryParams: Record<string, string> = {
        offset: String(offset),
        limit: String(limit),
      }
      if (status) {
        queryParams.status = status
      }
      return adminFetch<PagesResponse>("/admin/pages", {
        params: queryParams,
      })
    },
  })
}

export function usePage(id: string) {
  return useQuery<{ page: Page }>({
    queryKey: ["page", id],
    queryFn: () => adminFetch<{ page: Page }>(`/admin/pages/${id}`),
    enabled: !!id,
  })
}

export function useCreatePage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      title: string
      slug: string
      content?: string
      status?: string
      template?: string | null
      sort_order?: number
      translations?: Record<string, any> | null
      seo?: Record<string, any> | null
    }) =>
      adminFetch<{ page: Page }>("/admin/pages", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] })
    },
  })
}

export function useUpdatePage(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      title?: string
      slug?: string
      content?: string | null
      status?: string
      template?: string | null
      sort_order?: number
      translations?: Record<string, any> | null
      seo?: Record<string, any> | null
    }) =>
      adminFetch<{ page: Page }>(`/admin/pages/${id}`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] })
      queryClient.invalidateQueries({ queryKey: ["page", id] })
    },
  })
}

export function useDeletePage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/pages/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] })
    },
  })
}
