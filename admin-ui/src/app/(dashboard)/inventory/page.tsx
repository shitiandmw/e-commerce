"use client"

import { InventoryTable } from "@/components/inventory/inventory-table"

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">
          Manage stock levels, track inventory across locations, and monitor low stock alerts.
        </p>
      </div>
      <InventoryTable />
    </div>
  )
}
