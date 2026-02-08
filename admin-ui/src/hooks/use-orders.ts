"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch, AdminOrder } from "@/lib/admin-api"

// Re-export the type for convenience
export type { AdminOrder }

export interface OrdersResponse {
  orders: AdminOrder[]
  count: number
  offset: number
  limit: number
}

export interface OrderListParams {
  q?: string
  offset?: number
  limit?: number
  order?: string
  status?: string[]
  fulfillment_status?: string[]
  payment_status?: string[]
  created_at?: { gte?: string; lte?: string }
}

export function useOrders(params: OrderListParams = {}) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: async () => {
      const query: Record<string, string> = {}
      if (params.q) query.q = params.q
      if (params.offset !== undefined) query.offset = String(params.offset)
      if (params.limit !== undefined) query.limit = String(params.limit)
      if (params.order) query.order = params.order
      // Fields: request expanded relations for the list view
      query.fields =
        "+items,+customer,+shipping_address,+fulfillments,+payment_collections"

      // Build the query string manually to support arrays
      const searchParams = new URLSearchParams()
      Object.entries(query).forEach(([k, v]) => searchParams.set(k, v))

      if (params.status && params.status.length > 0) {
        params.status.forEach((s) => searchParams.append("status[]", s))
      }

      return adminFetch<OrdersResponse>(
        `/admin/orders?${searchParams.toString()}`
      )
    },
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () =>
      adminFetch<{ order: AdminOrder }>(
        `/admin/orders/${id}?fields=+items,+items.variant,+customer,+shipping_address,+billing_address,+shipping_methods,+fulfillments,+fulfillments.items,+fulfillments.labels,+payment_collections,+payment_collections.payments,+region,+sales_channel`
      ),
    enabled: !!id,
  })
}

/**
 * Cancel an order via POST /admin/orders/:id/cancel
 */
export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderId: string) => {
      return adminFetch<{ order: AdminOrder }>(
        `/admin/orders/${orderId}/cancel`,
        { method: "POST" }
      )
    },
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["order", orderId] })
    },
  })
}

/**
 * Complete an order via POST /admin/orders/:id/complete
 */
export function useCompleteOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderId: string) => {
      return adminFetch<{ order: AdminOrder }>(
        `/admin/orders/${orderId}/complete`,
        { method: "POST" }
      )
    },
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["order", orderId] })
    },
  })
}

/**
 * Create a fulfillment for an order.
 * Simplified: we auto-fulfill all unfulfilled items.
 */
export function useCreateFulfillment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      order_id: string
      location_id: string
      items: Array<{
        title: string
        quantity: number
        line_item_id: string
        inventory_item_id: string
      }>
    }) => {
      return adminFetch<{ fulfillment: unknown }>("/admin/fulfillments", {
        method: "POST",
        body: {
          ...payload,
          provider_id: "manual_manual", // default manual provider
        },
      })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({
        queryKey: ["order", variables.order_id],
      })
    },
  })
}

/**
 * Create a refund for a payment.
 * POST /admin/payments/:id/refund
 */
export function useCreateRefund() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      payment_id: string
      amount: number
      order_id: string
    }) => {
      return adminFetch<unknown>(
        `/admin/payments/${payload.payment_id}/refund`,
        {
          method: "POST",
          body: {
            amount: payload.amount,
          },
        }
      )
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({
        queryKey: ["order", variables.order_id],
      })
    },
  })
}
