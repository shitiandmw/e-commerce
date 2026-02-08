"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"

// ---- Shipping Options ----

export interface ShippingOptionPrice {
  id?: string
  amount: number
  currency_code: string
}

export interface ShippingOptionRule {
  id?: string
  attribute: string
  operator: string
  value: unknown
}

export interface ShippingOption {
  id: string
  name: string
  price_type: string
  service_zone_id?: string
  shipping_profile_id?: string
  provider_id?: string
  data?: Record<string, unknown>
  rules?: ShippingOptionRule[]
  prices?: ShippingOptionPrice[]
  type?: {
    id: string
    label: string
    description?: string
    code: string
  }
  created_at: string
  updated_at: string
}

interface ShippingOptionsResponse {
  shipping_options: ShippingOption[]
  count: number
  offset: number
  limit: number
}

export interface ShippingOptionsQueryParams {
  offset?: number
  limit?: number
  stock_location_id?: string
}

export function useShippingOptions(params: ShippingOptionsQueryParams = {}) {
  const { offset = 0, limit = 20, stock_location_id } = params

  const queryParams: Record<string, string> = {
    offset: String(offset),
    limit: String(limit),
  }
  if (stock_location_id) queryParams.stock_location_id = stock_location_id

  return useQuery<ShippingOptionsResponse>({
    queryKey: ["shipping-options", { offset, limit, stock_location_id }],
    queryFn: () =>
      adminFetch<ShippingOptionsResponse>("/admin/shipping-options", {
        params: queryParams,
      }),
  })
}

export function useShippingOption(id: string) {
  return useQuery<{ shipping_option: ShippingOption }>({
    queryKey: ["shipping-option", id],
    queryFn: () =>
      adminFetch<{ shipping_option: ShippingOption }>(
        `/admin/shipping-options/${id}`
      ),
    enabled: !!id,
  })
}

export function useCreateShippingOption() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      adminFetch<{ shipping_option: ShippingOption }>(
        "/admin/shipping-options",
        {
          method: "POST",
          body: data,
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-options"] })
    },
  })
}

export function useUpdateShippingOption(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      adminFetch<{ shipping_option: ShippingOption }>(
        `/admin/shipping-options/${id}`,
        {
          method: "POST",
          body: data,
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-options"] })
      queryClient.invalidateQueries({ queryKey: ["shipping-option", id] })
    },
  })
}

export function useDeleteShippingOption() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/shipping-options/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-options"] })
    },
  })
}

// ---- Shipping Profiles ----

export interface ShippingProfile {
  id: string
  name: string
  type: string
  created_at: string
  updated_at: string
}

interface ShippingProfilesResponse {
  shipping_profiles: ShippingProfile[]
  count: number
  offset: number
  limit: number
}

export function useShippingProfiles() {
  return useQuery<ShippingProfilesResponse>({
    queryKey: ["shipping-profiles"],
    queryFn: () =>
      adminFetch<ShippingProfilesResponse>("/admin/shipping-profiles", {
        params: { limit: "50" },
      }),
  })
}

export function useCreateShippingProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; type: string }) =>
      adminFetch<{ shipping_profile: ShippingProfile }>(
        "/admin/shipping-profiles",
        {
          method: "POST",
          body: data,
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-profiles"] })
    },
  })
}

export function useDeleteShippingProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/shipping-profiles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-profiles"] })
    },
  })
}

// ---- Fulfillment Providers ----

export interface FulfillmentProvider {
  id: string
  is_enabled?: boolean
}

interface FulfillmentProvidersResponse {
  fulfillment_providers: FulfillmentProvider[]
  count: number
  offset: number
  limit: number
}

export function useFulfillmentProviders() {
  return useQuery<FulfillmentProvidersResponse>({
    queryKey: ["fulfillment-providers"],
    queryFn: () =>
      adminFetch<FulfillmentProvidersResponse>(
        "/admin/fulfillment-providers",
        {
          params: { limit: "50" },
        }
      ),
  })
}

// ---- Stock Locations ----

export interface StockLocation {
  id: string
  name: string
  address?: {
    address_1?: string
    city?: string
    country_code?: string
    postal_code?: string
    province?: string
  }
  created_at: string
  updated_at: string
}

interface StockLocationsResponse {
  stock_locations: StockLocation[]
  count: number
  offset: number
  limit: number
}

export function useStockLocations() {
  return useQuery<StockLocationsResponse>({
    queryKey: ["stock-locations"],
    queryFn: () =>
      adminFetch<StockLocationsResponse>("/admin/stock-locations", {
        params: { limit: "50" },
      }),
  })
}
