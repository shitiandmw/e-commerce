"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"

// Types
export interface BannerItem {
  id: string
  slot_id: string
  image_url: string
  title?: string | null
  subtitle?: string | null
  link_url?: string | null
  sort_order: number
  is_enabled: boolean
  starts_at?: string | null
  ends_at?: string | null
  created_at: string
  updated_at: string
}

export interface BannerSlot {
  id: string
  name: string
  key: string
  description?: string | null
  items?: BannerItem[]
  created_at: string
  updated_at: string
}

export interface BannerSlotsResponse {
  banner_slots: BannerSlot[]
  count: number
  offset: number
  limit: number
}

export interface BannerItemsResponse {
  banner_items: BannerItem[]
  count: number
  offset: number
  limit: number
}

// ---- Slot Hooks ----

export function useBannerSlots(params: { offset?: number; limit?: number } = {}) {
  const { offset = 0, limit = 20 } = params

  return useQuery<BannerSlotsResponse>({
    queryKey: ["banner-slots", { offset, limit }],
    queryFn: () =>
      adminFetch<BannerSlotsResponse>("/admin/banner-slots", {
        params: {
          offset: String(offset),
          limit: String(limit),
        },
      }),
  })
}

export function useBannerSlot(id: string) {
  return useQuery<{ banner_slot: BannerSlot }>({
    queryKey: ["banner-slot", id],
    queryFn: () =>
      adminFetch<{ banner_slot: BannerSlot }>(`/admin/banner-slots/${id}`),
    enabled: !!id,
  })
}

export function useCreateBannerSlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; key: string; description?: string }) =>
      adminFetch<{ banner_slot: BannerSlot }>("/admin/banner-slots", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banner-slots"] })
    },
  })
}

export function useUpdateBannerSlot(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      name?: string
      key?: string
      description?: string | null
    }) =>
      adminFetch<{ banner_slot: BannerSlot }>(`/admin/banner-slots/${id}`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banner-slots"] })
      queryClient.invalidateQueries({ queryKey: ["banner-slot", id] })
    },
  })
}

export function useDeleteBannerSlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/banner-slots/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banner-slots"] })
    },
  })
}

// ---- Item Hooks ----

export function useBannerItems(slotId?: string) {
  return useQuery<BannerItemsResponse>({
    queryKey: ["banner-items", { slot_id: slotId }],
    queryFn: () =>
      adminFetch<BannerItemsResponse>("/admin/banner-items", {
        params: slotId ? { slot_id: slotId } : undefined,
      }),
    enabled: !!slotId,
  })
}

export function useCreateBannerItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      slot_id: string
      image_url: string
      title?: string
      subtitle?: string
      link_url?: string
      sort_order?: number
      is_enabled?: boolean
      starts_at?: string | null
      ends_at?: string | null
    }) =>
      adminFetch<{ banner_item: BannerItem }>("/admin/banner-items", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banner-items"] })
      queryClient.invalidateQueries({ queryKey: ["banner-slot"] })
    },
  })
}

export function useUpdateBannerItem(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      image_url?: string
      title?: string | null
      subtitle?: string | null
      link_url?: string | null
      sort_order?: number
      is_enabled?: boolean
      starts_at?: string | null
      ends_at?: string | null
    }) =>
      adminFetch<{ banner_item: BannerItem }>(`/admin/banner-items/${id}`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banner-items"] })
      queryClient.invalidateQueries({ queryKey: ["banner-slot"] })
    },
  })
}

export function useDeleteBannerItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/banner-items/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banner-items"] })
      queryClient.invalidateQueries({ queryKey: ["banner-slot"] })
    },
  })
}
