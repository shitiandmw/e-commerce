"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "@/lib/sdk"
import { getToken } from "@/lib/auth"

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
      const token = getToken()
      const query: Record<string, string | number> = {}
      if (params.q) query.q = params.q
      if (params.offset !== undefined) query.offset = params.offset
      if (params.limit !== undefined) query.limit = params.limit
      if (params.order) query.order = params.order

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"}/admin/customers?${new URLSearchParams(
          Object.entries(query).map(([k, v]) => [k, String(v)])
        ).toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch customers")
      }

      return response.json() as Promise<CustomerListResponse>
    },
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const token = getToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"}/admin/customers/${id}?fields=*addresses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch customer")
      }

      const data = await response.json()
      return data.customer as Customer
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
      const token = getToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"}/admin/customers/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to update customer")
      }

      const result = await response.json()
      return result.customer as Customer
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
    queryFn: async () => {
      const token = getToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"}/admin/orders?customer_id=${customerId}&limit=20&order=-created_at`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch customer orders")
      }

      return response.json() as Promise<{
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
      }>
    },
    enabled: !!customerId,
  })
}
