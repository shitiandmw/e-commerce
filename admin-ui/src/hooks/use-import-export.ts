"use client"

import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { adminFetch, AdminOrder, AdminCustomer } from "@/lib/admin-api"
import { generateCSV, downloadCSV } from "@/lib/csv"
import { ImportResult } from "@/components/import-export/import-dialog"
import type { Product, ProductsResponse } from "@/hooks/use-products"
import type { OrdersResponse } from "@/hooks/use-orders"
import type { CustomerListResponse, Customer } from "@/hooks/use-customers"

// ============================================================
// PRODUCT IMPORT / EXPORT
// ============================================================

export const PRODUCT_CSV_HEADERS = [
  "title",
  "subtitle",
  "description",
  "handle",
  "status",
  "weight",
  "length",
  "height",
  "width",
]

/**
 * Hook providing product import and export functionality.
 */
export function useProductImportExport() {
  const queryClient = useQueryClient()

  const exportProducts = useCallback(async () => {
    // Fetch all products (paginated)
    const allProducts: Product[] = []
    let offset = 0
    const limit = 50

    while (true) {
      const queryParams = new URLSearchParams()
      queryParams.set("offset", String(offset))
      queryParams.set("limit", String(limit))
      queryParams.set(
        "fields",
        "+variants,+variants.prices,+options,+options.values,+images,+categories,+brand"
      )

      const data = await adminFetch<ProductsResponse>(
        `/admin/products?${queryParams.toString()}`
      )
      allProducts.push(...data.products)

      if (allProducts.length >= data.count) break
      offset += limit
    }

    const csv = generateCSV(allProducts, [
      { header: "id", accessor: (p) => p.id },
      { header: "title", accessor: (p) => p.title },
      { header: "subtitle", accessor: (p) => p.subtitle || "" },
      { header: "description", accessor: (p) => p.description || "" },
      { header: "handle", accessor: (p) => p.handle || "" },
      { header: "status", accessor: (p) => p.status },
      {
        header: "variants_count",
        accessor: (p) => p.variants?.length || 0,
      },
      {
        header: "first_variant_sku",
        accessor: (p) => p.variants?.[0]?.sku || "",
      },
      {
        header: "first_variant_price",
        accessor: (p) => {
          const price = p.variants?.[0]?.prices?.[0]
          return price ? (price.amount / 100).toFixed(2) : ""
        },
      },
      {
        header: "first_variant_currency",
        accessor: (p) => p.variants?.[0]?.prices?.[0]?.currency_code || "",
      },
      {
        header: "categories",
        accessor: (p) =>
          p.categories?.map((c) => c.name).join("; ") || "",
      },
      {
        header: "brand",
        accessor: (p) => {
          const b = Array.isArray(p.brand) ? p.brand[0] : p.brand
          return b?.name || ""
        },
      },
      { header: "weight", accessor: (p) => p.weight || "" },
      { header: "length", accessor: (p) => p.length || "" },
      { header: "height", accessor: (p) => p.height || "" },
      { header: "width", accessor: (p) => p.width || "" },
      { header: "created_at", accessor: (p) => p.created_at },
      { header: "updated_at", accessor: (p) => p.updated_at },
    ])

    const date = new Date().toISOString().slice(0, 10)
    downloadCSV(csv, `products-export-${date}.csv`)
  }, [])

  const importProducts = useCallback(
    async (
      rows: Record<string, string>[],
      onProgress: (current: number, total: number) => void
    ): Promise<ImportResult> => {
      const result: ImportResult = {
        total: rows.length,
        success: 0,
        failed: 0,
        errors: [],
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        try {
          if (!row.title || !row.title.trim()) {
            throw new Error("Title is required")
          }

          const productData: Record<string, unknown> = {
            title: row.title.trim(),
            status: (row.status as string) || "draft",
          }

          if (row.subtitle) productData.subtitle = row.subtitle.trim()
          if (row.description)
            productData.description = row.description.trim()
          if (row.handle) productData.handle = row.handle.trim()
          if (row.weight) productData.weight = Number(row.weight)
          if (row.length) productData.length = Number(row.length)
          if (row.height) productData.height = Number(row.height)
          if (row.width) productData.width = Number(row.width)

          await adminFetch("/admin/products", {
            method: "POST",
            body: productData,
          })

          result.success++
        } catch (err) {
          result.failed++
          result.errors.push(
            `Row ${i + 1} (${row.title || "untitled"}): ${
              err instanceof Error ? err.message : "Unknown error"
            }`
          )
        }
        onProgress(i + 1, rows.length)
      }

      // Refresh product list
      queryClient.invalidateQueries({ queryKey: ["products"] })

      return result
    },
    [queryClient]
  )

  return { exportProducts, importProducts }
}

// ============================================================
// ORDER EXPORT
// ============================================================

/**
 * Hook providing order export functionality.
 */
export function useOrderExport() {
  const exportOrders = useCallback(async () => {
    // Fetch all orders (paginated)
    const allOrders: AdminOrder[] = []
    let offset = 0
    const limit = 50

    while (true) {
      const queryParams = new URLSearchParams()
      queryParams.set("offset", String(offset))
      queryParams.set("limit", String(limit))
      queryParams.set("order", "-created_at")
      queryParams.set(
        "fields",
        "+items,+customer,+shipping_address,+fulfillments,+payment_collections"
      )

      const data = await adminFetch<OrdersResponse>(
        `/admin/orders?${queryParams.toString()}`
      )
      allOrders.push(...data.orders)

      if (allOrders.length >= data.count) break
      offset += limit
    }

    const csv = generateCSV(allOrders, [
      { header: "order_id", accessor: (o) => o.id },
      { header: "display_id", accessor: (o) => o.display_id },
      { header: "status", accessor: (o) => o.status },
      {
        header: "customer_email",
        accessor: (o) => o.email || o.customer?.email || "",
      },
      {
        header: "customer_name",
        accessor: (o) => {
          const c = o.customer
          if (!c) return ""
          return [c.first_name, c.last_name].filter(Boolean).join(" ")
        },
      },
      { header: "currency", accessor: (o) => o.currency_code },
      {
        header: "total",
        accessor: (o) => (o.total / 100).toFixed(2),
      },
      {
        header: "subtotal",
        accessor: (o) => (o.subtotal / 100).toFixed(2),
      },
      {
        header: "tax_total",
        accessor: (o) => ((o.tax_total || 0) / 100).toFixed(2),
      },
      {
        header: "shipping_total",
        accessor: (o) => ((o.shipping_total || 0) / 100).toFixed(2),
      },
      {
        header: "discount_total",
        accessor: (o) => ((o.discount_total || 0) / 100).toFixed(2),
      },
      {
        header: "items_count",
        accessor: (o) => o.items?.length || 0,
      },
      {
        header: "items_summary",
        accessor: (o) =>
          o.items
            ?.map((item) => `${item.title} x${item.quantity}`)
            .join("; ") || "",
      },
      { header: "payment_status", accessor: (o) => o.payment_status || "" },
      {
        header: "fulfillment_status",
        accessor: (o) => o.fulfillment_status || "",
      },
      {
        header: "shipping_city",
        accessor: (o) => o.shipping_address?.city || "",
      },
      {
        header: "shipping_country",
        accessor: (o) => o.shipping_address?.country_code || "",
      },
      {
        header: "shipping_postal_code",
        accessor: (o) => o.shipping_address?.postal_code || "",
      },
      { header: "created_at", accessor: (o) => o.created_at },
    ])

    const date = new Date().toISOString().slice(0, 10)
    downloadCSV(csv, `orders-export-${date}.csv`)
  }, [])

  return { exportOrders }
}

// ============================================================
// CUSTOMER EXPORT
// ============================================================

/**
 * Hook providing customer export functionality.
 */
export function useCustomerExport() {
  const exportCustomers = useCallback(async () => {
    // Fetch all customers (paginated)
    const allCustomers: Customer[] = []
    let offset = 0
    const limit = 50

    while (true) {
      const data = await adminFetch<CustomerListResponse>(
        "/admin/customers",
        {
          params: {
            offset: String(offset),
            limit: String(limit),
            order: "-created_at",
          },
        }
      )
      allCustomers.push(...data.customers)

      if (allCustomers.length >= data.count) break
      offset += limit
    }

    const csv = generateCSV(allCustomers, [
      { header: "id", accessor: (c) => c.id },
      { header: "email", accessor: (c) => c.email },
      { header: "first_name", accessor: (c) => c.first_name || "" },
      { header: "last_name", accessor: (c) => c.last_name || "" },
      { header: "phone", accessor: (c) => c.phone || "" },
      {
        header: "has_account",
        accessor: (c) => (c.has_account ? "Yes" : "No"),
      },
      { header: "company", accessor: (c) => c.company_name || "" },
      {
        header: "addresses_count",
        accessor: (c) => c.addresses?.length || 0,
      },
      {
        header: "default_shipping_address",
        accessor: (c) => {
          const addr = c.addresses?.find((a) => a.is_default_shipping)
          if (!addr) return ""
          return [addr.address_1, addr.city, addr.province, addr.postal_code, addr.country_code]
            .filter(Boolean)
            .join(", ")
        },
      },
      { header: "created_at", accessor: (c) => c.created_at },
    ])

    const date = new Date().toISOString().slice(0, 10)
    downloadCSV(csv, `customers-export-${date}.csv`)
  }, [])

  return { exportCustomers }
}
