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
    queryFn: async () => {
      const res = await adminFetch<{ stores: AdminStore[] }>("/admin/stores")
      return { store: res.stores[0] }
    },
  })
}

export function useUpdateStore(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name?: string }) =>
      adminFetch<{ store: AdminStore }>(`/admin/stores/${storeId}`, {
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
        params: { limit: "50", fields: "+countries,*payment_providers" },
      }),
  })
}

export function useRegion(id: string) {
  return useQuery<{ region: AdminRegion }>({
    queryKey: ["admin-region", id],
    queryFn: () =>
      adminFetch<{ region: AdminRegion }>(`/admin/regions/${id}`, {
        params: { fields: "+countries,*payment_providers" },
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
      payment_providers?: string[]
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
      payment_providers?: string[]
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
        params: { limit: "200" },
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

/**
 * 将 payment provider ID 转为可读名称
 * pp_stripe_stripe → Stripe
 * pp_stripe-ideal_stripe → Stripe Ideal
 * pp_system_default → System Default
 */
export function formatProviderName(id: string): string {
  // 去掉 pp_ 前缀
  const withoutPrefix = id.replace(/^pp_/, "")
  // 按 _ 分割，取第一段作为名称（第二段是 type，可忽略）
  const parts = withoutPrefix.split("_")
  const name = parts[0] || withoutPrefix
  // 把 stripe-ideal 这种转成 Stripe Ideal
  return name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ")
}

// ---- Payment Settings (Runtime Config) ----

export interface AdminPaymentSetting {
  id: string
  provider_id: string
  is_enabled: boolean
  display_name: string | null
  description: string | null
  sandbox_mode: boolean
  api_key_masked: string | null
  is_api_key_set: boolean
  webhook_secret_masked: string | null
  is_webhook_secret_set: boolean
  created_at: string
  updated_at: string
}

interface PaymentSettingsResponse {
  payment_settings: AdminPaymentSetting[]
}

export function usePaymentSettings() {
  return useQuery<PaymentSettingsResponse>({
    queryKey: ["admin-payment-settings"],
    queryFn: () =>
      adminFetch<PaymentSettingsResponse>("/admin/payment-settings"),
  })
}

export function useUpdatePaymentSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      provider_id: string
      is_enabled?: boolean
      display_name?: string
      description?: string
      sandbox_mode?: boolean
      api_key?: string
      webhook_secret?: string
    }) =>
      adminFetch<{ payment_setting: AdminPaymentSetting }>("/admin/payment-settings", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payment-settings"] })
    },
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
  avatar_url?: string | null
  metadata?: Record<string, unknown> | null
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
      adminFetch<UsersResponse>("/admin/account-users", {
        params: { limit: "50" },
      }),
  })
}

export function useCurrentAdminUser() {
  return useQuery<{ user: AdminUser }>({
    queryKey: ["admin-current-user"],
    queryFn: () =>
      adminFetch<{ user: AdminUser }>("/admin/account-users/me"),
  })
}

export function useCreateAdminUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      email: string
      password: string
      confirm_password: string
      first_name?: string
      last_name?: string
      avatar_url?: string
    }) =>
      adminFetch<{ user: AdminUser }>("/admin/account-users", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] })
    },
  })
}

export function useUpdateAdminUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string
      first_name?: string | null
      last_name?: string | null
      avatar_url?: string | null
      metadata?: Record<string, unknown> | null
    }) =>
      adminFetch<{ user: AdminUser }>(`/admin/account-users/${id}`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] })
      qc.invalidateQueries({ queryKey: ["admin-current-user"] })
    },
  })
}

export function useResetAdminUserPassword() {
  return useMutation({
    mutationFn: (data: {
      id: string
      password: string
      confirm_password: string
    }) =>
      adminFetch<{ success: boolean }>(`/admin/account-users/${data.id}/reset-password`, {
        method: "POST",
        body: {
          password: data.password,
          confirm_password: data.confirm_password,
        },
      }),
  })
}

export function useChangeOwnPassword() {
  return useMutation({
    mutationFn: (data: {
      current_password: string
      password: string
      confirm_password: string
    }) =>
      adminFetch<{ success: boolean }>("/admin/account-users/me/change-password", {
        method: "POST",
        body: data,
      }),
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
