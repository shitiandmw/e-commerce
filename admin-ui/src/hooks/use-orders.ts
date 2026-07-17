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
  delivery_type?: "pickup" | "delivery"
  created_at?: { gte?: string; lte?: string }
}

const ORDER_LIST_FIELDS =
  "+items,*customer,+email,+shipping_address,*shipping_methods,+metadata,+fulfillments,+payment_collections"

const ORDER_DETAIL_FIELDS =
  "+email,+customer_id,+items,+items.variant,*customer,+shipping_address,+billing_address,*shipping_methods,+metadata,+fulfillments,+fulfillments.items,+fulfillments.labels,+payment_collections,+payment_collections.payments,+region,+sales_channel"

export function useOrders(params: OrderListParams = {}) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: async () => {
      const query: Record<string, string> = {}
      if (params.q) query.q = params.q
      if (params.offset !== undefined) query.offset = String(params.offset)
      if (params.limit !== undefined) query.limit = String(params.limit)
      if (params.order) query.order = params.order
      // Fields: request expanded relations for the list view.
      query.fields = ORDER_LIST_FIELDS

      // Build the query string manually to support arrays
      const searchParams = new URLSearchParams()
      Object.entries(query).forEach(([k, v]) => searchParams.set(k, v))

      if (params.status && params.status.length > 0) {
        params.status.forEach((s) => searchParams.append("status[]", s))
      }
      if (params.payment_status && params.payment_status.length > 0) {
        params.payment_status.forEach((s) =>
          searchParams.append("payment_status[]", s)
        )
      }
      if (params.fulfillment_status && params.fulfillment_status.length > 0) {
        params.fulfillment_status.forEach((s) =>
          searchParams.append("fulfillment_status[]", s)
        )
      }
      if (params.delivery_type) {
        searchParams.set("delivery_type", params.delivery_type)
      }

      const endpoint = params.delivery_type
        ? "/admin/orders-delivery"
        : "/admin/orders"

      return adminFetch<OrdersResponse>(
        `${endpoint}?${searchParams.toString()}`
      )
    },
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () =>
      adminFetch<{ order: AdminOrder }>(
        `/admin/orders/${id}?fields=${encodeURIComponent(ORDER_DETAIL_FIELDS)}`
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
 * POST /admin/orders/:id/fulfillments
 */
export function useCreateFulfillment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      order_id: string
      location_id: string
      items: Array<{
        id: string
        quantity: number
      }>
    }) => {
      return adminFetch<{ order: AdminOrder }>(
        `/admin/orders/${payload.order_id}/fulfillments`,
        {
          method: "POST",
          body: {
            location_id: payload.location_id,
            items: payload.items,
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

/**
 * Create a shipment for a fulfillment.
 * POST /admin/fulfillments/:id/shipment
 */
export function useCreateShipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      order_id: string
      fulfillment_id: string
      labels?: Array<{
        tracking_number?: string
        tracking_url?: string
        label_url?: string
      }>
    }) => {
      return adminFetch<{ fulfillment: unknown }>(
        `/admin/fulfillments/${payload.fulfillment_id}/shipment`,
        {
          method: "POST",
          body: {
            labels: payload.labels ?? [],
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

/**
 * Create a tracking record for a fulfillment.
 * POST /admin/tracking
 */
export function useCreateTrackingRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      fulfillment_id: string
      tracking_number: string
      carrier: string
      carrier_name: string
      tracking_url?: string
    }) => {
      return adminFetch<{ tracking_record: unknown }>("/admin/tracking", {
        method: "POST",
        body: payload,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracking"] })
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
  })
}

/**
 * List tracking records, optionally filtered by fulfillment_id
 */
export function useTrackingRecords(fulfillmentIds?: string[]) {
  return useQuery({
    queryKey: ["tracking", fulfillmentIds],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (fulfillmentIds && fulfillmentIds.length > 0) {
        fulfillmentIds.forEach((id) => params.append("fulfillment_id", id))
      }
      params.set("limit", "100")
      return adminFetch<{
        tracking_records: Array<{
          id: string
          fulfillment_id: string
          tracking_number: string
          carrier: string
          carrier_name: string
          status: string
          tracking_url: string | null
          last_synced_at: string | null
          estimated_delivery: string | null
          events: Array<{
            id: string
            status: string
            description: string
            location: string | null
            occurred_at: string
          }>
          created_at: string
        }>
        count: number
      }>(`/admin/tracking?${params.toString()}`)
    },
    enabled: fulfillmentIds === undefined || fulfillmentIds.length > 0,
  })
}

/**
 * Get available carriers list
 */
export function useCarriers() {
  return useQuery({
    queryKey: ["carriers"],
    queryFn: () =>
      adminFetch<{
        carriers: Array<{
          id: string
          name: string
          trackingUrlTemplate: string | null
        }>
      }>("/admin/tracking/carriers"),
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
