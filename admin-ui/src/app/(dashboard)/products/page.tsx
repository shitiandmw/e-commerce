"use client"

import { ProductTable } from "@/components/products/product-table"

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Manage your product catalog
        </p>
      </div>

      <ProductTable />
    </div>
  )
}
