"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"

export interface PickupLocation {
  id: string
  name: string
  address: string
  phone?: string | null
  hours?: string | null
  note?: string | null
  sort_order: number
  is_enabled: boolean
  created_at: string
  updated_at: string
}

interface PickupLocationsResponse {
  pickup_locations: PickupLocation[]
  count: number
  offset: number
  limit: number
}

export interface PickupLocationInput {
  name: string
  address: string
  phone?: string | null
  hours?: string | null
  note?: string | null
  sort_order?: number
  is_enabled?: boolean
}

export function usePickupLocations(params: { offset?: number; limit?: number } = {}) {
  const { offset = 0, limit = 100 } = params

  return useQuery<PickupLocationsResponse>({
    queryKey: ["pickup-locations", { offset, limit }],
    queryFn: () =>
      adminFetch<PickupLocationsResponse>("/admin/pickup-locations", {
        params: {
          offset: String(offset),
          limit: String(limit),
          order: "sort_order",
        },
      }),
  })
}

export function useCreatePickupLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PickupLocationInput) =>
      adminFetch<{ pickup_location: PickupLocation }>("/admin/pickup-locations", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickup-locations"] })
    },
  })
}

export function useUpdatePickupLocation(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<PickupLocationInput>) =>
      adminFetch<{ pickup_location: PickupLocation }>(`/admin/pickup-locations/${id}`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickup-locations"] })
    },
  })
}

export function useDeletePickupLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/pickup-locations/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickup-locations"] })
    },
  })
}
