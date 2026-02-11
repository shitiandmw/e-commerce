"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"

// Types
export interface Announcement {
  id: string
  text: string
  link_url?: string | null
  sort_order: number
  is_enabled: boolean
  starts_at?: string | null
  ends_at?: string | null
  created_at: string
  updated_at: string
}

export interface AnnouncementsResponse {
  announcements: Announcement[]
  count: number
  offset: number
  limit: number
}

export interface AnnouncementsQueryParams {
  offset?: number
  limit?: number
}

// Hooks
export function useAnnouncements(params: AnnouncementsQueryParams = {}) {
  const { offset = 0, limit = 50 } = params

  return useQuery<AnnouncementsResponse>({
    queryKey: ["announcements", { offset, limit }],
    queryFn: () =>
      adminFetch<AnnouncementsResponse>("/admin/announcements", {
        params: {
          offset: String(offset),
          limit: String(limit),
          order: "sort_order",
        },
      }),
  })
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      text: string
      link_url?: string | null
      sort_order?: number
      is_enabled?: boolean
      starts_at?: string | null
      ends_at?: string | null
    }) =>
      adminFetch<{ announcement: Announcement }>("/admin/announcements", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] })
    },
  })
}

export function useUpdateAnnouncement(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      text?: string
      link_url?: string | null
      sort_order?: number
      is_enabled?: boolean
      starts_at?: string | null
      ends_at?: string | null
    }) =>
      adminFetch<{ announcement: Announcement }>(`/admin/announcements/${id}`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] })
    },
  })
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/announcements/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] })
    },
  })
}
