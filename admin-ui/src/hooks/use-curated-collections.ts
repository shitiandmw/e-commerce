"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"

// ---- Types ----

export interface CuratedCollection {
  id: string
  name: string
  key: string
  description?: string | null
  sort_order: number
  created_at: string
  updated_at: string
  tabs?: CollectionTab[]
  items?: CollectionItem[]
}

export interface CollectionTab {
  id: string
  collection_id: string
  name: string
  key: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CollectionItem {
  id: string
  collection_id: string
  tab_id?: string | null
  product_id: string
  sort_order: number
  created_at: string
  updated_at: string
  product?: {
    id: string
    title: string
    status: string
    thumbnail?: string | null
  }
}

export interface CollectionsResponse {
  collections: CuratedCollection[]
  count: number
  offset: number
  limit: number
}

export interface CollectionsQueryParams {
  offset?: number
  limit?: number
}

// ---- Collection Hooks ----

export function useCollections(params: CollectionsQueryParams = {}) {
  const { offset = 0, limit = 20 } = params

  return useQuery<CollectionsResponse>({
    queryKey: ["curated-collections", { offset, limit }],
    queryFn: () =>
      adminFetch<CollectionsResponse>("/admin/curated-collections", {
        params: {
          offset: String(offset),
          limit: String(limit),
        },
      }),
  })
}

export function useCollection(id: string) {
  return useQuery<{ collection: CuratedCollection }>({
    queryKey: ["curated-collection", id],
    queryFn: () =>
      adminFetch<{ collection: CuratedCollection }>(
        `/admin/curated-collections/${id}`
      ),
    enabled: !!id,
  })
}

export function useCreateCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      name: string
      key: string
      description?: string
      sort_order?: number
    }) =>
      adminFetch<{ collection: CuratedCollection }>(
        "/admin/curated-collections",
        {
          method: "POST",
          body: data,
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curated-collections"] })
    },
  })
}

export function useUpdateCollection(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      name?: string
      key?: string
      description?: string | null
      sort_order?: number
    }) =>
      adminFetch<{ collection: CuratedCollection }>(
        `/admin/curated-collections/${id}`,
        {
          method: "POST",
          body: data,
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curated-collections"] })
      queryClient.invalidateQueries({ queryKey: ["curated-collection", id] })
    },
  })
}

export function useDeleteCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/curated-collections/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curated-collections"] })
    },
  })
}

// ---- Tab Hooks ----

export function useCollectionTabs(collectionId: string) {
  return useQuery<{ tabs: CollectionTab[] }>({
    queryKey: ["curated-collection-tabs", collectionId],
    queryFn: () =>
      adminFetch<{ tabs: CollectionTab[] }>(
        `/admin/curated-collections/${collectionId}/tabs`
      ),
    enabled: !!collectionId,
  })
}

export function useCreateTab(collectionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; key: string; sort_order?: number }) =>
      adminFetch<{ tab: CollectionTab }>(
        `/admin/curated-collections/${collectionId}/tabs`,
        {
          method: "POST",
          body: data,
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["curated-collection-tabs", collectionId],
      })
      queryClient.invalidateQueries({
        queryKey: ["curated-collection", collectionId],
      })
    },
  })
}

export function useUpdateTab(collectionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tabId,
      data,
    }: {
      tabId: string
      data: { name?: string; key?: string; sort_order?: number }
    }) =>
      adminFetch<{ tab: CollectionTab }>(
        `/admin/curated-collections/${collectionId}/tabs/${tabId}`,
        {
          method: "POST",
          body: data,
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["curated-collection-tabs", collectionId],
      })
      queryClient.invalidateQueries({
        queryKey: ["curated-collection", collectionId],
      })
    },
  })
}

export function useDeleteTab(collectionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tabId: string) =>
      adminFetch(
        `/admin/curated-collections/${collectionId}/tabs/${tabId}`,
        {
          method: "DELETE",
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["curated-collection-tabs", collectionId],
      })
      queryClient.invalidateQueries({
        queryKey: ["curated-collection", collectionId],
      })
    },
  })
}

// ---- Item Hooks ----

export function useCollectionItems(collectionId: string, tabId?: string) {
  return useQuery<{ items: CollectionItem[] }>({
    queryKey: ["curated-collection-items", collectionId, tabId],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (tabId) params.tab_id = tabId
      return adminFetch<{ items: CollectionItem[] }>(
        `/admin/curated-collections/${collectionId}/items`,
        { params }
      )
    },
    enabled: !!collectionId,
  })
}

export function useAddCollectionItem(collectionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      product_id: string
      tab_id?: string
      sort_order?: number
    }) =>
      adminFetch<{ item: CollectionItem }>(
        `/admin/curated-collections/${collectionId}/items`,
        {
          method: "POST",
          body: data,
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["curated-collection-items", collectionId],
      })
      queryClient.invalidateQueries({
        queryKey: ["curated-collection", collectionId],
      })
    },
  })
}

export function useUpdateCollectionItem(collectionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string
      data: { sort_order?: number; tab_id?: string }
    }) =>
      adminFetch<{ item: CollectionItem }>(
        `/admin/curated-collections/${collectionId}/items/${itemId}`,
        {
          method: "POST",
          body: data,
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["curated-collection-items", collectionId],
      })
      queryClient.invalidateQueries({
        queryKey: ["curated-collection", collectionId],
      })
    },
  })
}

export function useRemoveCollectionItem(collectionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: string) =>
      adminFetch(
        `/admin/curated-collections/${collectionId}/items/${itemId}`,
        {
          method: "DELETE",
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["curated-collection-items", collectionId],
      })
      queryClient.invalidateQueries({
        queryKey: ["curated-collection", collectionId],
      })
    },
  })
}
