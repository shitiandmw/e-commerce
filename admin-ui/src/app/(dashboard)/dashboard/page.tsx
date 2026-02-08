"use client"

import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  RefreshCw,
} from "lucide-react"
import { useDashboardStats } from "@/lib/admin-api"
import { StatCard } from "@/components/stat-card"
import { SalesChart, OrdersBarChart } from "@/components/sales-chart"
import { RecentOrders } from "@/components/recent-orders"
import { useQueryClient } from "@tanstack/react-query"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toLocaleString()
}

export default function DashboardPage() {
  const { data: stats, isLoading, isError, error } = useDashboardStats()
  const queryClient = useQueryClient()

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your store performance
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Error Banner */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">Failed to load dashboard data</p>
          <p className="mt-1 text-red-600">
            {error instanceof Error
              ? error.message
              : "Please check your connection and try again."}
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={stats ? formatCurrency(stats.totalRevenue) : "0.00"}
          icon={DollarSign}
          change={stats?.revenueChange}
          loading={isLoading}
          prefix="$"
        />
        <StatCard
          title="Orders"
          value={stats ? formatNumber(stats.totalOrders) : "0"}
          icon={ShoppingCart}
          change={stats?.ordersChange}
          loading={isLoading}
        />
        <StatCard
          title="Customers"
          value={stats ? formatNumber(stats.totalCustomers) : "0"}
          icon={Users}
          change={stats?.customersChange}
          loading={isLoading}
        />
        <StatCard
          title="Products"
          value={stats ? formatNumber(stats.totalProducts) : "0"}
          icon={Package}
          loading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SalesChart
          data={stats?.salesByMonth || []}
          loading={isLoading}
        />
        <OrdersBarChart
          data={stats?.salesByMonth || []}
          loading={isLoading}
        />
      </div>

      {/* Recent Orders */}
      <RecentOrders
        orders={stats?.recentOrders || []}
        loading={isLoading}
      />
    </div>
  )
}
