"use client"

import { OrderTable } from "@/components/orders/order-table"

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Manage customer orders, track fulfillments, and process payments
        </p>
      </div>

      <OrderTable />
    </div>
  )
}
