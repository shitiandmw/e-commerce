"use client"

import { useQuery } from "@tanstack/react-query"
import { adminFetch, AdminOrder, AdminCustomer } from "@/lib/admin-api"
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  subDays,
  subWeeks,
  subMonths,
  format,
  isAfter,
  isBefore,
  parseISO,
  differenceInDays,
} from "date-fns"

// ---- Types ----

export type DateGranularity = "day" | "week" | "month"

export interface SalesTrendPoint {
  label: string
  revenue: number
  orders: number
}

export interface TopProduct {
  id: string
  title: string
  totalQuantity: number
  totalRevenue: number
}

export interface RevenueByCategoryItem {
  name: string
  revenue: number
}

export interface CustomerSegment {
  name: string
  value: number
}

export interface AnalyticsData {
  // Sales trend
  salesTrend: SalesTrendPoint[]

  // Summary KPIs
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  revenueChange: number
  ordersChange: number

  // Top 10 products
  topProducts: TopProduct[]

  // Customer analysis
  customerSegments: CustomerSegment[] // new vs returning
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  avgLTV: number

  // Revenue by brand
  revenueByBrand: RevenueByCategoryItem[]

  // Revenue by product category
  revenueByCategory: RevenueByCategoryItem[]
}

// ---- Helpers ----

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

/**
 * Fetch all orders by paginating through the API.
 * We fetch in batches of 100 and stop when we have all.
 */
async function fetchAllOrders(): Promise<AdminOrder[]> {
  const allOrders: AdminOrder[] = []
  let offset = 0
  const limit = 100
  let total = Infinity

  while (offset < total) {
    const data = await adminFetch<{
      orders: AdminOrder[]
      count: number
    }>("/admin/orders", {
      params: {
        limit: String(limit),
        offset: String(offset),
        order: "-created_at",
        fields: "+items,+items.variant,+customer,+items.product_id",
      },
    })
    allOrders.push(...(data.orders || []))
    total = data.count || 0
    offset += limit
    // Safety: cap at 500 orders to avoid excessive fetching
    if (offset >= 500) break
  }

  return allOrders
}

interface ProductWithBrandAndCategory {
  id: string
  title: string
  categories?: Array<{ id: string; name: string }> | null
  brand?: { id: string; name: string } | null
}

async function fetchAllProducts(): Promise<ProductWithBrandAndCategory[]> {
  const allProducts: ProductWithBrandAndCategory[] = []
  let offset = 0
  const limit = 100
  let total = Infinity

  while (offset < total) {
    const data = await adminFetch<{
      products: ProductWithBrandAndCategory[]
      count: number
    }>("/admin/products", {
      params: {
        limit: String(limit),
        offset: String(offset),
        fields: "+categories,+brand",
      },
    })
    allProducts.push(...(data.products || []))
    total = data.count || 0
    offset += limit
    if (offset >= 500) break
  }

  return allProducts
}

async function fetchAllCustomers(): Promise<AdminCustomer[]> {
  const allCustomers: AdminCustomer[] = []
  let offset = 0
  const limit = 100
  let total = Infinity

  while (offset < total) {
    const data = await adminFetch<{
      customers: AdminCustomer[]
      count: number
    }>("/admin/customers", {
      params: {
        limit: String(limit),
        offset: String(offset),
      },
    })
    allCustomers.push(...(data.customers || []))
    total = data.count || 0
    offset += limit
    if (offset >= 500) break
  }

  return allCustomers
}

// ---- Computation ----

function computeSalesTrend(
  orders: AdminOrder[],
  granularity: DateGranularity,
  dateRange: { from: Date; to: Date }
): SalesTrendPoint[] {
  const { from, to } = dateRange
  const points: Map<string, { revenue: number; orders: number }> = new Map()

  // Build time buckets
  const bucketKeys: string[] = []
  let cursor = new Date(from)

  while (!isAfter(cursor, to)) {
    let key: string
    if (granularity === "day") {
      key = format(cursor, "MM/dd")
      cursor = new Date(cursor.getTime() + 86400000)
    } else if (granularity === "week") {
      key = format(startOfWeek(cursor, { weekStartsOn: 1 }), "MM/dd")
      cursor = new Date(cursor.getTime() + 7 * 86400000)
    } else {
      key = format(cursor, "MMM yyyy")
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    }
    if (!points.has(key)) {
      points.set(key, { revenue: 0, orders: 0 })
      bucketKeys.push(key)
    }
  }

  // Fill buckets
  orders.forEach((order) => {
    const d = parseISO(order.created_at)
    if (isBefore(d, from) || isAfter(d, to)) return

    let key: string
    if (granularity === "day") {
      key = format(d, "MM/dd")
    } else if (granularity === "week") {
      key = format(startOfWeek(d, { weekStartsOn: 1 }), "MM/dd")
    } else {
      key = format(d, "MMM yyyy")
    }

    const bucket = points.get(key)
    if (bucket) {
      bucket.revenue += (order.total || 0) / 100
      bucket.orders += 1
    }
  })

  return bucketKeys.map((key) => ({
    label: key,
    revenue: Math.round((points.get(key)?.revenue || 0) * 100) / 100,
    orders: points.get(key)?.orders || 0,
  }))
}

function computeTopProducts(orders: AdminOrder[]): TopProduct[] {
  const productMap = new Map<
    string,
    { title: string; totalQuantity: number; totalRevenue: number }
  >()

  orders.forEach((order) => {
    ;(order.items || []).forEach((item) => {
      const productTitle = item.product_title || item.title || "Unknown"
      // Use product_title as grouping key since we don't always have product_id in items
      const key = productTitle

      if (!productMap.has(key)) {
        productMap.set(key, {
          title: productTitle,
          totalQuantity: 0,
          totalRevenue: 0,
        })
      }
      const entry = productMap.get(key)!
      entry.totalQuantity += item.quantity
      entry.totalRevenue += (item.total || item.unit_price * item.quantity) / 100
    })
  })

  return Array.from(productMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10)
}

function computeCustomerAnalysis(
  orders: AdminOrder[],
  customers: AdminCustomer[],
  dateRange: { from: Date; to: Date }
): {
  segments: CustomerSegment[]
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  avgLTV: number
} {
  const { from } = dateRange
  const totalCustomers = customers.length

  // New customers: created within the date range
  const newCustomers = customers.filter((c) => {
    const d = parseISO(c.created_at)
    return !isBefore(d, from)
  }).length

  const returningCustomers = totalCustomers - newCustomers

  // Compute average LTV: total revenue / number of unique customers who ordered
  const customerOrderMap = new Map<string, number>()
  orders.forEach((order) => {
    const customerId = order.customer?.id
    if (customerId) {
      customerOrderMap.set(
        customerId,
        (customerOrderMap.get(customerId) || 0) + (order.total || 0) / 100
      )
    }
  })

  const orderingCustomers = customerOrderMap.size
  const totalCustomerRevenue = Array.from(customerOrderMap.values()).reduce(
    (sum, v) => sum + v,
    0
  )
  const avgLTV =
    orderingCustomers > 0
      ? Math.round((totalCustomerRevenue / orderingCustomers) * 100) / 100
      : 0

  const segments: CustomerSegment[] = [
    { name: "New Customers", value: newCustomers },
    { name: "Returning", value: returningCustomers },
  ]

  return { segments, totalCustomers, newCustomers, returningCustomers, avgLTV }
}

function computeRevenueByBrand(
  orders: AdminOrder[],
  products: ProductWithBrandAndCategory[]
): RevenueByCategoryItem[] {
  // Build product -> brand map
  const productBrandMap = new Map<string, string>()
  products.forEach((p) => {
    if (p.brand?.name) {
      productBrandMap.set(p.id, p.brand.name)
    }
  })

  const brandRevenue = new Map<string, number>()
  orders.forEach((order) => {
    ;(order.items || []).forEach((item) => {
      // Try to find brand from product map using product_id if available
      const productId = (item as unknown as Record<string, unknown>)
        .product_id as string | undefined
      const brandName = productId
        ? productBrandMap.get(productId) || "Unbranded"
        : "Unbranded"
      brandRevenue.set(
        brandName,
        (brandRevenue.get(brandName) || 0) +
          (item.total || item.unit_price * item.quantity) / 100
      )
    })
  })

  return Array.from(brandRevenue.entries())
    .map(([name, revenue]) => ({
      name,
      revenue: Math.round(revenue * 100) / 100,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
}

function computeRevenueByCategory(
  orders: AdminOrder[],
  products: ProductWithBrandAndCategory[]
): RevenueByCategoryItem[] {
  // Build product -> category map
  const productCategoryMap = new Map<string, string>()
  products.forEach((p) => {
    const categoryName =
      p.categories && p.categories.length > 0
        ? p.categories[0].name
        : "Uncategorized"
    productCategoryMap.set(p.id, categoryName)
  })

  const categoryRevenue = new Map<string, number>()
  orders.forEach((order) => {
    ;(order.items || []).forEach((item) => {
      const productId = (item as unknown as Record<string, unknown>)
        .product_id as string | undefined
      const catName = productId
        ? productCategoryMap.get(productId) || "Uncategorized"
        : "Uncategorized"
      categoryRevenue.set(
        catName,
        (categoryRevenue.get(catName) || 0) +
          (item.total || item.unit_price * item.quantity) / 100
      )
    })
  })

  return Array.from(categoryRevenue.entries())
    .map(([name, revenue]) => ({
      name,
      revenue: Math.round(revenue * 100) / 100,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
}

// ---- Main Hook ----

export interface AnalyticsParams {
  granularity: DateGranularity
  dateRange: { from: Date; to: Date }
}

export function useAnalytics(params: AnalyticsParams) {
  const { granularity, dateRange } = params

  return useQuery({
    queryKey: [
      "analytics",
      granularity,
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
    ],
    queryFn: async (): Promise<AnalyticsData> => {
      // Fetch all data concurrently
      const [orders, products, customers] = await Promise.all([
        fetchAllOrders(),
        fetchAllProducts(),
        fetchAllCustomers(),
      ])

      // Filter orders within date range
      const filteredOrders = orders.filter((o) => {
        const d = parseISO(o.created_at)
        return !isBefore(d, dateRange.from) && !isAfter(d, dateRange.to)
      })

      // Compute previous period for comparison
      const rangeDays = differenceInDays(dateRange.to, dateRange.from)
      const prevFrom = subDays(dateRange.from, rangeDays)
      const prevTo = dateRange.from
      const prevOrders = orders.filter((o) => {
        const d = parseISO(o.created_at)
        return !isBefore(d, prevFrom) && isBefore(d, prevTo)
      })

      // KPIs
      const totalRevenue =
        filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0) / 100
      const totalOrders = filteredOrders.length
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      const prevRevenue =
        prevOrders.reduce((sum, o) => sum + (o.total || 0), 0) / 100
      const revenueChange = percentChange(totalRevenue, prevRevenue)
      const ordersChange = percentChange(
        filteredOrders.length,
        prevOrders.length
      )

      // Sales trend
      const salesTrend = computeSalesTrend(orders, granularity, dateRange)

      // Top products
      const topProducts = computeTopProducts(filteredOrders)

      // Customer analysis
      const customerAnalysis = computeCustomerAnalysis(
        filteredOrders,
        customers,
        dateRange
      )

      // Revenue by brand & category
      const revenueByBrand = computeRevenueByBrand(filteredOrders, products)
      const revenueByCategory = computeRevenueByCategory(
        filteredOrders,
        products
      )

      return {
        salesTrend,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        revenueChange,
        ordersChange,
        topProducts,
        customerSegments: customerAnalysis.segments,
        totalCustomers: customerAnalysis.totalCustomers,
        newCustomers: customerAnalysis.newCustomers,
        returningCustomers: customerAnalysis.returningCustomers,
        avgLTV: customerAnalysis.avgLTV,
        revenueByBrand,
        revenueByCategory,
      }
    },
    staleTime: 60 * 1000, // 1 minute
  })
}
