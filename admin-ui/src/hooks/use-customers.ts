"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"

export interface CustomerAddress {
  id: string
  first_name: string | null
  last_name: string | null
  company: string | null
  address_1: string | null
  address_2: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  country_code: string | null
  phone: string | null
  is_default_shipping: boolean
  is_default_billing: boolean
}

export interface Customer {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  has_account: boolean
  company_name: string | null
  addresses: CustomerAddress[]
  created_at: string
  updated_at: string
  metadata: Record<string, unknown> | null
}

export interface CustomerListResponse {
  customers: Customer[]
  count: number
  offset: number
  limit: number
}

export interface CustomerListParams {
  q?: string
  offset?: number
  limit?: number
  order?: string
}

export function useCustomers(params: CustomerListParams = {}) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: async () => {
      const query: Record<string, string> = {}
      if (params.q) query.q = params.q
      if (params.offset !== undefined) query.offset = String(params.offset)
      if (params.limit !== undefined) query.limit = String(params.limit)
      if (params.order) query.order = params.order

      return adminFetch<CustomerListResponse>("/admin/customers", {
        params: query,
      })
    },
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const data = await adminFetch<{ customer: Customer }>(
        `/admin/customers/${id}?fields=*addresses`
      )
      return data.customer
    },
    enabled: !!id,
  })
}

export interface UpdateCustomerData {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  company_name?: string
  metadata?: Record<string, unknown>
}

export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateCustomerData) => {
      const result = await adminFetch<{ customer: Customer }>(
        `/admin/customers/${id}`,
        {
          method: "POST",
          body: data,
        }
      )
      return result.customer
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", id] })
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}

export function useCustomerOrders(customerId: string) {
  return useQuery({
    queryKey: ["customer-orders", customerId],
    queryFn: () =>
      adminFetch<{
        orders: Array<{
          id: string
          display_id: number
          status: string
          total: number
          currency_code: string
          created_at: string
          items: Array<{
            id: string
            title: string
            quantity: number
            unit_price: number
          }>
        }>
        count: number
      }>("/admin/orders", {
        params: {
          customer_id: customerId,
          limit: "20",
          order: "-created_at",
        },
      }),
    enabled: !!customerId,
  })
}
