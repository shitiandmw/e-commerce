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
  metadata?: {
    type?: "pickup" | "delivery"
    [key: string]: unknown
  }
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
      queryClient.invalidateQueries({ queryKey: ["shipping-option-types"] })
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

// ---- Shipping Option Types ----

export interface ShippingOptionType {
  id: string
  label: string
  code: string
  description?: string
  created_at: string
  updated_at: string
}

interface ShippingOptionTypesResponse {
  shipping_option_types: ShippingOptionType[]
  count: number
  offset: number
  limit: number
}

export function useShippingOptionTypes() {
  return useQuery<ShippingOptionTypesResponse>({
    queryKey: ["shipping-option-types"],
    queryFn: () =>
      adminFetch<ShippingOptionTypesResponse>("/admin/shipping-option-types", {
        params: { limit: "50" },
      }),
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

const DEFAULT_FULFILLMENT_PROVIDER_ID = "manual_manual"

export interface FulfillmentProvider {
  id: string
  is_enabled?: boolean
}

export interface FulfillmentProvidersQueryParams {
  stock_location_id?: string
}

interface FulfillmentProvidersQueryOptions {
  enabled?: boolean
}

interface FulfillmentProvidersResponse {
  fulfillment_providers: FulfillmentProvider[]
  count: number
  offset: number
  limit: number
}

export function useFulfillmentProviders(
  params: FulfillmentProvidersQueryParams = {},
  options: FulfillmentProvidersQueryOptions = {}
) {
  const { stock_location_id } = params
  const { enabled = true } = options
  const queryParams: Record<string, string> = { limit: "50" }
  if (stock_location_id) queryParams.stock_location_id = stock_location_id

  return useQuery<FulfillmentProvidersResponse>({
    queryKey: ["fulfillment-providers", { stock_location_id }],
    queryFn: () =>
      adminFetch<FulfillmentProvidersResponse>(
        "/admin/fulfillment-providers",
        {
          params: queryParams,
        }
      ),
    enabled,
  })
}

// ---- Stock Locations ----

export interface SalesChannelRef {
  id: string
  name: string
}

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
  sales_channels?: SalesChannelRef[]
  created_at: string
  updated_at: string
}

export type StockLocationSetupWarning =
  | "fulfillment_set_failed"
  | "provider_binding_failed"
  | "sales_channels_failed"

export interface CreateStockLocationResponse {
  stock_location: StockLocation
  setup_warnings?: StockLocationSetupWarning[]
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

// ---- Service Zones (via Stock Locations) ----

export interface GeoZone {
  id: string
  country_code: string
  type: string
}

export interface ServiceZone {
  id: string
  name: string
  geo_zones: GeoZone[]
}

export interface FulfillmentSet {
  id: string
  name: string
  type: string
  service_zones: ServiceZone[]
}

export interface StockLocationWithZones extends StockLocation {
  fulfillment_sets: FulfillmentSet[]
  sales_channels?: SalesChannelRef[]
}

interface StockLocationsWithZonesResponse {
  stock_locations: StockLocationWithZones[]
  count: number
}

export function useStockLocationsWithZones() {
  return useQuery<StockLocationsWithZonesResponse>({
    queryKey: ["stock-locations-zones"],
    queryFn: () =>
      adminFetch<StockLocationsWithZonesResponse>("/admin/stock-locations", {
        params: {
          limit: "50",
          fields:
            "*fulfillment_sets,*fulfillment_sets.service_zones,*fulfillment_sets.service_zones.geo_zones,*sales_channels",
        },
      }),
  })
}

export function useCreateServiceZone(fulfillmentSetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name: string
      geo_zones: { country_code: string; type: string }[]
    }) =>
      adminFetch(
        `/admin/fulfillment-sets/${fulfillmentSetId}/service-zones`,
        { method: "POST", body: data }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-locations-zones"] })
    },
  })
}

export function useUpdateServiceZone(
  fulfillmentSetId: string,
  zoneId: string
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name?: string
      geo_zones?: { country_code: string; type: string }[]
    }) =>
      adminFetch(
        `/admin/fulfillment-sets/${fulfillmentSetId}/service-zones/${zoneId}`,
        { method: "POST", body: data }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-locations-zones"] })
    },
  })
}

export function useDeleteServiceZone(fulfillmentSetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (zoneId: string) =>
      adminFetch(
        `/admin/fulfillment-sets/${fulfillmentSetId}/service-zones/${zoneId}`,
        { method: "DELETE" }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-locations-zones"] })
    },
  })
}

// ---- Stock Location CRUD ----

export function useCreateStockLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      address?: {
        address_1?: string
        city?: string
        province?: string
        postal_code?: string
        country_code?: string
      }
    }) => {
      const res = await adminFetch<CreateStockLocationResponse>(
        "/admin/stock-locations",
        { method: "POST", body: data }
      )
      const setupWarnings: StockLocationSetupWarning[] = []

      // Auto-create a fulfillment set so the location can have service zones
      try {
        await adminFetch(
          `/admin/stock-locations/${res.stock_location.id}/fulfillment-sets`,
          {
            method: "POST",
            body: {
              name: `${data.name} delivery`,
              type: "shipping",
            },
          }
        )
      } catch {
        setupWarnings.push("fulfillment_set_failed")
      }

      try {
        await adminFetch(
          `/admin/stock-locations/${res.stock_location.id}/fulfillment-providers`,
          {
            method: "POST",
            body: { add: [DEFAULT_FULFILLMENT_PROVIDER_ID] },
          }
        )
      } catch {
        setupWarnings.push("provider_binding_failed")
      }

      return setupWarnings.length > 0
        ? { ...res, setup_warnings: setupWarnings }
        : res
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-locations"] })
      qc.invalidateQueries({ queryKey: ["stock-locations-zones"] })
      qc.invalidateQueries({ queryKey: ["fulfillment-providers"] })
    },
  })
}

export function useUpdateStockLocation(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name?: string
      address?: {
        address_1?: string
        city?: string
        province?: string
        postal_code?: string
        country_code?: string
      }
    }) =>
      adminFetch<{ stock_location: StockLocation }>(
        `/admin/stock-locations/${id}`,
        { method: "POST", body: data }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-locations"] })
      qc.invalidateQueries({ queryKey: ["stock-locations-zones"] })
    },
  })
}

export function useDeleteStockLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/stock-locations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-locations"] })
      qc.invalidateQueries({ queryKey: ["stock-locations-zones"] })
    },
  })
}

export function useUpdateStockLocationSalesChannels(locationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { add?: string[]; remove?: string[] }) =>
      adminFetch<{ stock_location: StockLocation }>(
        `/admin/stock-locations/${locationId}/sales-channels`,
        { method: "POST", body: data }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-locations"] })
      qc.invalidateQueries({ queryKey: ["stock-locations-zones"] })
    },
  })
}
