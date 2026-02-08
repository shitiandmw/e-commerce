"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { subDays } from "date-fns"
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
  BarChart3,
  AreaChart as AreaChartIcon,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useAnalytics, type DateGranularity } from "@/hooks/use-analytics"
import { StatCard } from "@/components/stat-card"
import { DateRangePicker } from "@/components/analytics/date-range-picker"
import { SalesTrendChart } from "@/components/analytics/sales-trend-chart"
import { TopProductsChart } from "@/components/analytics/top-products-chart"
import { CustomerAnalysisChart } from "@/components/analytics/customer-analysis-chart"
import { RevenueDistributionChart } from "@/components/analytics/revenue-distribution-chart"

export default function AnalyticsPage() {
  const t = useTranslations("analytics")
  const queryClient = useQueryClient()

  // Date range state
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [granularity, setGranularity] = useState<DateGranularity>("day")
  const [chartType, setChartType] = useState<"area" | "bar">("area")

  const { data, isLoading, isError, error } = useAnalytics({
    granularity,
    dateRange,
  })

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["analytics"] })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Chart type toggle */}
          <div className="flex items-center gap-1 rounded-md border bg-card p-0.5">
            <button
              onClick={() => setChartType("area")}
              className={`rounded p-1.5 transition-colors ${
                chartType === "area"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              }`}
              title="Area chart"
            >
              <AreaChartIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`rounded p-1.5 transition-colors ${
                chartType === "bar"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              }`}
              title="Bar chart"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            {t("refresh")}
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      <DateRangePicker
        from={dateRange.from}
        to={dateRange.to}
        granularity={granularity}
        onRangeChange={(from, to) => setDateRange({ from, to })}
        onGranularityChange={setGranularity}
      />

      {/* Error Banner */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">{t("loadFailed")}</p>
          <p className="mt-1 text-red-600">
            {error instanceof Error
              ? error.message
              : t("checkConnection")}
          </p>
        </div>
      )}

      {/* KPI Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("totalRevenue")}
          value={
            data
              ? data.totalRevenue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })
              : "0.00"
          }
          icon={DollarSign}
          change={data?.revenueChange}
          loading={isLoading}
          prefix="$"
        />
        <StatCard
          title={t("totalOrders")}
          value={data ? data.totalOrders.toLocaleString() : "0"}
          icon={ShoppingCart}
          change={data?.ordersChange}
          loading={isLoading}
        />
        <StatCard
          title={t("avgOrderValue")}
          value={
            data
              ? data.avgOrderValue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })
              : "0.00"
          }
          icon={TrendingUp}
          loading={isLoading}
          prefix="$"
        />
        <StatCard
          title={t("customers")}
          value={data ? data.totalCustomers.toLocaleString() : "0"}
          icon={DollarSign}
          loading={isLoading}
        />
      </div>

      {/* Sales Trend Chart */}
      <SalesTrendChart
        data={data?.salesTrend || []}
        loading={isLoading}
        chartType={chartType}
      />

      {/* Two columns: Top Products + Customer Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopProductsChart
          data={data?.topProducts || []}
          loading={isLoading}
        />
        <CustomerAnalysisChart
          segments={data?.customerSegments || []}
          totalCustomers={data?.totalCustomers || 0}
          newCustomers={data?.newCustomers || 0}
          returningCustomers={data?.returningCustomers || 0}
          avgLTV={data?.avgLTV || 0}
          loading={isLoading}
        />
      </div>

      {/* Revenue Distribution: by Brand + by Category */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueDistributionChart
          data={data?.revenueByBrand || []}
          title={t("revenueByBrand")}
          subtitle={t("revenueByBrandSubtitle")}
          loading={isLoading}
        />
        <RevenueDistributionChart
          data={data?.revenueByCategory || []}
          title={t("revenueByCategory")}
          subtitle={t("revenueByCategorySubtitle")}
          loading={isLoading}
        />
      </div>
    </div>
  )
}
