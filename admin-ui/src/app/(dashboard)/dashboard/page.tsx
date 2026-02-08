"use client"

import { Package, ShoppingCart, Users, DollarSign } from "lucide-react"

const stats = [
  {
    name: "Total Revenue",
    value: "$0.00",
    icon: DollarSign,
    change: "+0%",
  },
  {
    name: "Orders",
    value: "0",
    icon: ShoppingCart,
    change: "+0%",
  },
  {
    name: "Products",
    value: "0",
    icon: Package,
    change: "+0%",
  },
  {
    name: "Customers",
    value: "0",
    icon: Users,
    change: "+0%",
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your store performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-lg border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </p>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.change} from last month</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders Placeholder */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
        <p className="text-sm text-muted-foreground">
          No orders yet. Orders will appear here once customers start purchasing.
        </p>
      </div>
    </div>
  )
}
