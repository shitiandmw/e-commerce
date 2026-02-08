"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Bar,
  BarChart,
} from "recharts"
import { useTranslations } from "next-intl"

interface SalesChartProps {
  data: { month: string; revenue: number; orders: number }[]
  loading?: boolean
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number; name: string; color: string }[]
  label?: string
}) {
  const t = useTranslations("dashboard.salesChart")
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="mb-1 text-sm font-medium text-foreground">{label}</p>
      {payload.map((entry, index) => (
        <p
          key={index}
          className="text-xs"
          style={{ color: entry.color }}
        >
          {entry.name === "revenue"
            ? `${t("revenueLabel")}: $${entry.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
            : `${t("ordersLabel")}: ${entry.value}`}
        </p>
      ))}
    </div>
  )
}

export function SalesChart({ data, loading = false }: SalesChartProps) {
  const t = useTranslations("dashboard.salesChart")

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-4 h-5 w-36 animate-pulse rounded bg-muted" />
        <div className="h-[300px] animate-pulse rounded bg-muted/50" />
      </div>
    )
  }

  const hasData = data.some((d) => d.revenue > 0 || d.orders > 0)

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold">{t("title")}</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("subtitle")}
      </p>

      {!hasData ? (
        <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          {t("noData")}
        </div>
      ) : (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(221.2, 83.2%, 53.3%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(221.2, 83.2%, 53.3%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  `$${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                formatter={(value) =>
                  value === "revenue" ? t("revenue") : t("orders")
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(221.2, 83.2%, 53.3%)"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export function OrdersBarChart({ data, loading = false }: SalesChartProps) {
  const t = useTranslations("dashboard.ordersChart")

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-4 h-5 w-36 animate-pulse rounded bg-muted" />
        <div className="h-[300px] animate-pulse rounded bg-muted/50" />
      </div>
    )
  }

  const hasData = data.some((d) => d.orders > 0)

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold">{t("title")}</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("subtitle")}
      </p>

      {!hasData ? (
        <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          {t("noData")}
        </div>
      ) : (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="orders"
                fill="hsl(221.2, 83.2%, 53.3%)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
