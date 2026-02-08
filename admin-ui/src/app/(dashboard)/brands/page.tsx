"use client"

import { BrandTable } from "@/components/brands/brand-table"

export default function BrandsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
        <p className="text-muted-foreground">
          Manage your product brands
        </p>
      </div>

      <BrandTable />
    </div>
  )
}
