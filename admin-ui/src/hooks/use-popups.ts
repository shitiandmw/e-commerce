"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"

// Types
export interface Popup {
  id: string
  title?: string | null
  description?: string | null
  image_url?: string | null
  button_text?: string | null
  button_link?: string | null
  is_enabled: boolean
  trigger_type: "first_visit" | "every_visit" | "specific_page"
  display_frequency: "once" | "once_per_session" | "once_per_day"
  target_page?: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PopupsResponse {
  popups: Popup[]
  count: number
  offset: number
  limit: number
}

export interface PopupsQueryParams {
  offset?: number
  limit?: number
}

// Hooks
export function usePopups(params: PopupsQueryParams = {}) {
  const { offset = 0, limit = 20 } = params

  return useQuery<PopupsResponse>({
    queryKey: ["popups", { offset, limit }],
    queryFn: () =>
      adminFetch<PopupsResponse>("/admin/popups", {
        params: {
          offset: String(offset),
          limit: String(limit),
        },
      }),
  })
}

export function usePopup(id: string) {
  return useQuery<{ popup: Popup }>({
    queryKey: ["popup", id],
    queryFn: () => adminFetch<{ popup: Popup }>(`/admin/popups/${id}`),
    enabled: !!id,
  })
}

export function useCreatePopup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Popup>) =>
      adminFetch<{ popup: Popup }>("/admin/popups", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups"] })
    },
  })
}

export function useUpdatePopup(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Popup>) =>
      adminFetch<{ popup: Popup }>(`/admin/popups/${id}`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups"] })
      queryClient.invalidateQueries({ queryKey: ["popup", id] })
    },
  })
}

export function useDeletePopup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/popups/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups"] })
    },
  })
}
