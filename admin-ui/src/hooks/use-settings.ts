"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"

// ---- Store ----

export interface AdminStore {
  id: string
  name: string
  supported_currencies?: Array<{
    currency_code: string
    is_default?: boolean
  }>
  default_sales_channel_id?: string | null
  default_region_id?: string | null
  default_location_id?: string | null
  created_at: string
  updated_at: string
}

export function useStore() {
  return useQuery<{ store: AdminStore }>({
    queryKey: ["admin-store"],
    queryFn: () => adminFetch<{ store: AdminStore }>("/admin/stores"),
  })
}

export function useUpdateStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name?: string }) =>
      adminFetch<{ store: AdminStore }>("/admin/stores", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-store"] })
    },
  })
}

// ---- Regions ----

export interface AdminRegion {
  id: string
  name: string
  currency_code: string
  countries?: Array<{
    id?: string
    iso_2: string
    display_name?: string
    name?: string
  }>
  automatic_taxes?: boolean
  payment_providers?: Array<{ id: string }>
  created_at: string
  updated_at: string
}

interface RegionsResponse {
  regions: AdminRegion[]
  count: number
  offset: number
  limit: number
}

export function useRegions() {
  return useQuery<RegionsResponse>({
    queryKey: ["admin-regions"],
    queryFn: () =>
      adminFetch<RegionsResponse>("/admin/regions", {
        params: { limit: "50", fields: "+countries,+payment_providers" },
      }),
  })
}

export function useRegion(id: string) {
  return useQuery<{ region: AdminRegion }>({
    queryKey: ["admin-region", id],
    queryFn: () =>
      adminFetch<{ region: AdminRegion }>(`/admin/regions/${id}`, {
        params: { fields: "+countries,+payment_providers" },
      }),
    enabled: !!id,
  })
}

export function useCreateRegion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name: string
      currency_code: string
      countries?: string[]
      automatic_taxes?: boolean
    }) =>
      adminFetch<{ region: AdminRegion }>("/admin/regions", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-regions"] })
    },
  })
}

export function useUpdateRegion(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name?: string
      currency_code?: string
      countries?: string[]
      automatic_taxes?: boolean
    }) =>
      adminFetch<{ region: AdminRegion }>(`/admin/regions/${id}`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-regions"] })
      qc.invalidateQueries({ queryKey: ["admin-region", id] })
    },
  })
}

export function useDeleteRegion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/regions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-regions"] })
    },
  })
}

// ---- Currencies ----

export interface AdminCurrency {
  code: string
  symbol: string
  symbol_native: string
  name: string
  decimal_digits: number
}

interface CurrenciesResponse {
  currencies: AdminCurrency[]
  count: number
  offset: number
  limit: number
}

export function useCurrencies() {
  return useQuery<CurrenciesResponse>({
    queryKey: ["admin-currencies"],
    queryFn: () =>
      adminFetch<CurrenciesResponse>("/admin/currencies", {
        params: { limit: "100" },
      }),
  })
}

// ---- Sales Channels ----

export interface AdminSalesChannel {
  id: string
  name: string
  description?: string | null
  is_disabled: boolean
  created_at: string
  updated_at: string
}

interface SalesChannelsResponse {
  sales_channels: AdminSalesChannel[]
  count: number
  offset: number
  limit: number
}

export function useSalesChannels() {
  return useQuery<SalesChannelsResponse>({
    queryKey: ["admin-sales-channels"],
    queryFn: () =>
      adminFetch<SalesChannelsResponse>("/admin/sales-channels", {
        params: { limit: "50" },
      }),
  })
}

export function useCreateSalesChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string; is_disabled?: boolean }) =>
      adminFetch<{ sales_channel: AdminSalesChannel }>("/admin/sales-channels", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sales-channels"] })
    },
  })
}

export function useUpdateSalesChannel(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name?: string; description?: string; is_disabled?: boolean }) =>
      adminFetch<{ sales_channel: AdminSalesChannel }>(`/admin/sales-channels/${id}`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sales-channels"] })
    },
  })
}

export function useDeleteSalesChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/sales-channels/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sales-channels"] })
    },
  })
}

// ---- Shipping Options ----

export interface AdminShippingOption {
  id: string
  name: string
  price_type: string
  service_zone_id?: string
  shipping_profile_id?: string
  provider_id?: string
  data?: Record<string, unknown>
  rules?: Array<{
    id?: string
    attribute: string
    operator: string
    value: unknown
  }>
  prices?: Array<{
    id?: string
    amount: number
    currency_code: string
  }>
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
  shipping_options: AdminShippingOption[]
  count: number
  offset: number
  limit: number
}

export function useShippingOptions() {
  return useQuery<ShippingOptionsResponse>({
    queryKey: ["admin-shipping-options"],
    queryFn: () =>
      adminFetch<ShippingOptionsResponse>("/admin/shipping-options", {
        params: { limit: "50" },
      }),
  })
}

// ---- Payment Providers ----

export interface AdminPaymentProvider {
  id: string
  is_enabled?: boolean
}

interface PaymentProvidersResponse {
  payment_providers: AdminPaymentProvider[]
  count: number
  offset: number
  limit: number
}

export function usePaymentProviders() {
  return useQuery<PaymentProvidersResponse>({
    queryKey: ["admin-payment-providers"],
    queryFn: () =>
      adminFetch<PaymentProvidersResponse>("/admin/payment-providers", {
        params: { limit: "50" },
      }),
  })
}

// ---- Tax Regions ----

export interface AdminTaxRegion {
  id: string
  country_code: string
  province_code?: string | null
  parent_id?: string | null
  created_at: string
  updated_at: string
}

interface TaxRegionsResponse {
  tax_regions: AdminTaxRegion[]
  count: number
  offset: number
  limit: number
}

export function useTaxRegions() {
  return useQuery<TaxRegionsResponse>({
    queryKey: ["admin-tax-regions"],
    queryFn: () =>
      adminFetch<TaxRegionsResponse>("/admin/tax-regions", {
        params: { limit: "50" },
      }),
  })
}

// ---- Users (admin team) ----

export interface AdminUser {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  role?: string | null
  created_at: string
  updated_at: string
}

interface UsersResponse {
  users: AdminUser[]
  count: number
  offset: number
  limit: number
}

export function useUsers() {
  return useQuery<UsersResponse>({
    queryKey: ["admin-users"],
    queryFn: () =>
      adminFetch<UsersResponse>("/admin/users", {
        params: { limit: "50" },
      }),
  })
}

export function useInviteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { email: string }) =>
      adminFetch("/admin/invites", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] })
      qc.invalidateQueries({ queryKey: ["admin-invites"] })
    },
  })
}

export interface AdminInvite {
  id: string
  email: string
  accepted: boolean
  token?: string
  expires_at: string
  created_at: string
  updated_at: string
}

interface InvitesResponse {
  invites: AdminInvite[]
  count: number
  offset: number
  limit: number
}

export function useInvites() {
  return useQuery<InvitesResponse>({
    queryKey: ["admin-invites"],
    queryFn: () =>
      adminFetch<InvitesResponse>("/admin/invites", {
        params: { limit: "50" },
      }),
  })
}

export function useDeleteInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/invites/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-invites"] })
    },
  })
}

export function useResendInvite() {
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/invites/${id}/resend`, { method: "POST" }),
  })
}

// ---- API Keys (Publishable) ----

export interface AdminApiKey {
  id: string
  title: string
  type: string
  token?: string
  redacted?: string
  last_used_at?: string | null
  revoked_at?: string | null
  created_at: string
  updated_at: string
}

interface ApiKeysResponse {
  api_keys: AdminApiKey[]
  count: number
  offset: number
  limit: number
}

export function useApiKeys() {
  return useQuery<ApiKeysResponse>({
    queryKey: ["admin-api-keys"],
    queryFn: () =>
      adminFetch<ApiKeysResponse>("/admin/api-keys", {
        params: { limit: "50" },
      }),
  })
}

export function useCreateApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; type: string }) =>
      adminFetch<{ api_key: AdminApiKey }>("/admin/api-keys", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-api-keys"] })
    },
  })
}

export function useRevokeApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/api-keys/${id}/revoke`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-api-keys"] })
    },
  })
}
