"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"

// Types
export interface Tag {
  id: string
  name: string
  color?: string | null
  type: "badge" | "attribute"
  created_at: string
  updated_at: string
  products?: Array<{
    id: string
    title: string
    status: string
    thumbnail?: string | null
  }>
}

export interface TagsResponse {
  tags: Tag[]
  count: number
  offset: number
  limit: number
}

export interface TagsQueryParams {
  offset?: number
  limit?: number
}

// Hooks
export function useTags(params: TagsQueryParams = {}) {
  const { offset = 0, limit = 20 } = params

  return useQuery<TagsResponse>({
    queryKey: ["tags", { offset, limit }],
    queryFn: () =>
      adminFetch<TagsResponse>("/admin/tags", {
        params: {
          offset: String(offset),
          limit: String(limit),
        },
      }),
  })
}

export function useTag(id: string) {
  return useQuery<{ tag: Tag }>({
    queryKey: ["tag", id],
    queryFn: () => adminFetch<{ tag: Tag }>(`/admin/tags/${id}`),
    enabled: !!id,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; color?: string | null; type?: "badge" | "attribute" }) =>
      adminFetch<{ tag: Tag }>("/admin/tags", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
    },
  })
}

export function useUpdateTag(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      name?: string
      color?: string | null
      type?: "badge" | "attribute"
    }) =>
      adminFetch<{ tag: Tag }>(`/admin/tags/${id}`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      queryClient.invalidateQueries({ queryKey: ["tag", id] })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/tags/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
    },
  })
}

export function useLinkProductTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tag_id,
      product_id,
    }: {
      tag_id: string
      product_id: string
    }) =>
      adminFetch(`/admin/tags/${tag_id}/products`, {
        method: "POST",
        body: { product_id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      queryClient.invalidateQueries({ queryKey: ["tag"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product"] })
    },
  })
}

export function useUnlinkProductTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tag_id,
      product_id,
    }: {
      tag_id: string
      product_id: string
    }) =>
      adminFetch(`/admin/tags/${tag_id}/products`, {
        method: "DELETE",
        body: { product_id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      queryClient.invalidateQueries({ queryKey: ["tag"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product"] })
    },
  })
}
