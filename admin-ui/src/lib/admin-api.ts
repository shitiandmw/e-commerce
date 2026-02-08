"use client"

import { useQuery } from "@tanstack/react-query"
import { getToken } from "./auth"

const BASE_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

/**
 * Unified fetch wrapper for Admin API.
 * Supports GET (with query params) and mutation methods (POST/PUT/DELETE with body).
 * All modules should use this instead of creating their own fetch wrappers.
 */
export async function adminFetch<T>(
  path: string,
  options?: {
    params?: Record<string, string>
    method?: string
    body?: unknown
    headers?: Record<string, string>
  }
): Promise<T> {
  const token = getToken()
  const url = new URL(`${BASE_URL}${path}`)
  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  const res = await fetch(url.toString(), {
    method: options?.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(
      errorData.message || `Admin API error: ${res.status} ${res.statusText}`
    )
  }

  return res.json()
}

// ---- Types ----

export interface AdminOrder {
  id: string
  display_id: number
  status: string
  created_at: string
  updated_at: string
  email: string
  currency_code: string
  total: number
  subtotal: number
  tax_total: number
  shipping_total: number
  discount_total: number
  items?: AdminOrderItem[]
  customer?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  shipping_address?: {
    city: string
    country_code: string
  }
}

export interface AdminOrderItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  total: number
}

export interface AdminCustomer {
  id: string
  email: string
  first_name: string
  last_name: string
  created_at: string
  has_account: boolean
}

export interface AdminProduct {
  id: string
  title: string
  status: string
  created_at: string
}

interface ListResponse<T> {
  count: number
  offset: number
  limit: number
  [key: string]: T[] | number
}

interface OrdersResponse extends ListResponse<AdminOrder> {
  orders: AdminOrder[]
}

interface CustomersResponse extends ListResponse<AdminCustomer> {
  customers: AdminCustomer[]
}

interface ProductsResponse extends ListResponse<AdminProduct> {
  products: AdminProduct[]
}

// ---- Hooks ----

export function useOrders(params?: { limit?: number; offset?: number; order?: string; fields?: string }) {
  return useQuery({
    queryKey: ["admin-orders", params],
    queryFn: () => {
      const query: Record<string, string> = {}
      if (params?.limit) query.limit = String(params.limit)
      if (params?.offset !== undefined) query.offset = String(params.offset)
      if (params?.order) query.order = params.order
      if (params?.fields) query.fields = params.fields
      return adminFetch<OrdersResponse>("/admin/orders", { params: query })
    },
  })
}

export function useDashboardCustomers(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["admin-customers", params],
    queryFn: () => {
      const query: Record<string, string> = {}
      if (params?.limit) query.limit = String(params.limit)
      if (params?.offset !== undefined) query.offset = String(params.offset)
      return adminFetch<CustomersResponse>("/admin/customers", { params: query })
    },
  })
}

export function useDashboardProducts(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["admin-products", params],
    queryFn: () => {
      const query: Record<string, string> = {}
      if (params?.limit) query.limit = String(params.limit)
      if (params?.offset !== undefined) query.offset = String(params.offset)
      return adminFetch<ProductsResponse>("/admin/products", { params: query })
    },
  })
}

// ---- Dashboard Stats ----

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  recentOrders: AdminOrder[]
  salesByMonth: { month: string; revenue: number; orders: number }[]
  revenueChange: number
  ordersChange: number
  customersChange: number
}

/**
 * Compute percentage change between current period total and previous period total.
 */
function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

/**
 * Build month key string from date, e.g. "2026-01"
 */
function monthKey(dateStr: string): string {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

/**
 * Format month key to a human-readable label, e.g. "Jan 2026"
 */
function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-")
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[parseInt(month, 10) - 1]} ${year}`
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Fetch all data concurrently
      const [ordersData, customersData, productsData] = await Promise.all([
        adminFetch<OrdersResponse>("/admin/orders", {
          params: { limit: "100", offset: "0", order: "-created_at" },
        }),
        adminFetch<CustomersResponse>("/admin/customers", { params: { limit: "1", offset: "0" } }),
        adminFetch<ProductsResponse>("/admin/products", { params: { limit: "1", offset: "0" } }),
      ])

      const orders = ordersData.orders || []
      const totalOrders = ordersData.count || 0
      const totalCustomers = customersData.count || 0
      const totalProducts = productsData.count || 0

      // Calculate total revenue from orders
      // Medusa stores amounts in cents, convert to dollars
      const totalRevenue = orders.reduce((sum, order) => {
        return sum + (order.total || 0)
      }, 0)

      // Calculate current month vs last month stats for % change
      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

      const currentMonthOrders = orders.filter(
        (o) => new Date(o.created_at) >= currentMonthStart
      )
      const lastMonthOrders = orders.filter((o) => {
        const d = new Date(o.created_at)
        return d >= lastMonthStart && d < currentMonthStart
      })

      const currentMonthRevenue = currentMonthOrders.reduce(
        (sum, o) => sum + (o.total || 0),
        0
      )
      const lastMonthRevenue = lastMonthOrders.reduce(
        (sum, o) => sum + (o.total || 0),
        0
      )

      const revenueChange = percentChange(currentMonthRevenue, lastMonthRevenue)
      const ordersChange = percentChange(currentMonthOrders.length, lastMonthOrders.length)

      // Build sales by month for chart (last 6 months)
      const salesMap = new Map<string, { revenue: number; orders: number }>()

      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = monthKey(d.toISOString())
        salesMap.set(key, { revenue: 0, orders: 0 })
      }

      // Fill in with order data
      orders.forEach((order) => {
        const key = monthKey(order.created_at)
        if (salesMap.has(key)) {
          const entry = salesMap.get(key)!
          entry.revenue += order.total || 0
          entry.orders += 1
        }
      })

      const salesByMonth = Array.from(salesMap.entries()).map(([key, data]) => ({
        month: formatMonthLabel(key),
        revenue: data.revenue / 100, // convert cents to dollars
        orders: data.orders,
      }))

      // Recent orders (top 5)
      const recentOrders = orders.slice(0, 5)

      const stats: DashboardStats = {
        totalRevenue: totalRevenue / 100, // cents to dollars
        totalOrders,
        totalCustomers,
        totalProducts,
        recentOrders,
        salesByMonth,
        revenueChange,
        ordersChange,
        customersChange: 0, // can't easily compute from a single endpoint
      }

      return stats
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}
