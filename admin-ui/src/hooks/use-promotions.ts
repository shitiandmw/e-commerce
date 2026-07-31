"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"

// Types
export interface PromotionRule {
  id?: string
  attribute: string
  operator: "eq" | "ne" | "in" | "gt" | "gte" | "lt" | "lte"
  values: string[]
  description?: string
}

export interface ApplicationMethod {
  id?: string
  type: "percentage" | "fixed"
  value: number
  target_type: "items" | "shipping_methods" | "order"
  allocation?: "each" | "across"
  max_quantity?: number | null
  buy_rules_min_quantity?: number | null
  apply_to_quantity?: number | null
  currency_code?: string | null
  target_rules?: PromotionRule[]
  buy_rules?: PromotionRule[]
}

export interface Promotion {
  id: string
  code: string
  type: "standard" | "buyget"
  is_automatic: boolean
  status?: "draft" | "active" | "inactive"
  campaign_id?: string | null
  campaign?: {
    id: string
    name: string
    campaign_identifier?: string
    starts_at?: string | null
    ends_at?: string | null
  } | null
  application_method?: ApplicationMethod | null
  rules?: PromotionRule[]
  created_at: string
  updated_at: string
}

export interface PromotionsResponse {
  promotions: Promotion[]
  count: number
  offset: number
  limit: number
}

export interface PromotionsQueryParams {
  offset?: number
  limit?: number
  q?: string
  order?: string
  code?: string[]
}

// Hooks
export function usePromotions(params: PromotionsQueryParams = {}) {
  const { offset = 0, limit = 20, q, order } = params

  const queryParams = new URLSearchParams()
  queryParams.set("offset", String(offset))
  queryParams.set("limit", String(limit))
  if (q) queryParams.set("q", q)
  if (order) queryParams.set("order", order)
  queryParams.set("fields", "+application_method,+rules,+campaign")

  return useQuery<PromotionsResponse>({
    queryKey: ["promotions", { offset, limit, q, order }],
    queryFn: () =>
      adminFetch<PromotionsResponse>(
        `/admin/promotions?${queryParams.toString()}`
      ),
  })
}

export interface CampaignPayload {
  name?: string
  campaign_identifier?: string
  starts_at?: string | null
  ends_at?: string | null
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CampaignPayload & { name: string; campaign_identifier: string }) =>
      adminFetch<{ campaign: NonNullable<Promotion["campaign"]> }>(
        "/admin/campaigns",
        { method: "POST", body: data }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] })
    },
  })
}

export function useUpdateCampaign(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CampaignPayload) =>
      adminFetch<{ campaign: NonNullable<Promotion["campaign"]> }>(
        `/admin/campaigns/${id}`,
        { method: "POST", body: data }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] })
      queryClient.invalidateQueries({ queryKey: ["promotion"] })
    },
  })
}

export function usePromotion(id: string) {
  return useQuery<{ promotion: Promotion }>({
    queryKey: ["promotion", id],
    queryFn: () =>
      adminFetch<{ promotion: Promotion }>(
        `/admin/promotions/${id}?fields=+application_method,+application_method.target_rules,+application_method.buy_rules,+rules,+campaign`
      ),
    enabled: !!id,
  })
}

export function useCreatePromotion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      adminFetch<{ promotion: Promotion }>("/admin/promotions", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] })
    },
  })
}

export function useUpdatePromotion(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      adminFetch<{ promotion: Promotion }>(`/admin/promotions/${id}`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] })
      queryClient.invalidateQueries({ queryKey: ["promotion", id] })
    },
  })
}

export interface PromotionTargetRulesBatchPayload {
  create?: Array<{
    attribute: string
    operator: string
    values: string[]
  }>
  update?: Array<{
    id: string
    attribute: string
    operator: string
    values: string[]
  }>
  delete?: string[]
}

export function useBatchPromotionTargetRules(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PromotionTargetRulesBatchPayload) =>
      adminFetch(`/admin/promotions/${id}/target-rules/batch`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] })
      queryClient.invalidateQueries({ queryKey: ["promotion", id] })
    },
  })
}

export function useDeletePromotion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/promotions/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] })
    },
  })
}
