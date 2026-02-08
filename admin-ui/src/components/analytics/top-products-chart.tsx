"use client"

import { useTranslations } from "next-intl"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type { TopProduct } from "@/hooks/use-analytics"

interface TopProductsChartProps {
  data: TopProduct[]
  loading?: boolean
}

const COLORS = [
  "hsl(221.2, 83.2%, 53.3%)",
  "hsl(210, 78%, 60%)",
  "hsl(200, 74%, 55%)",
  "hsl(190, 70%, 50%)",
  "hsl(175, 65%, 47%)",
  "hsl(160, 60%, 45%)",
  "hsl(142, 55%, 43%)",
  "hsl(80, 50%, 45%)",
  "hsl(45, 55%, 50%)",
  "hsl(25, 60%, 52%)",
]

function CustomTooltip({
  active,
  payload,
  t,
}: {
  active?: boolean
  payload?: Array<{ payload: TopProduct }>
  t: (key: string) => string
}) {
  if (!active || !payload || payload.length === 0) return null
  const product = payload[0].payload

  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="mb-1 text-sm font-medium text-foreground">{product.title}</p>
      <p className="text-xs text-muted-foreground">
        {t("topProductsChart.revenue")}: ${product.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </p>
      <p className="text-xs text-muted-foreground">
        {t("topProductsChart.quantitySold")}: {product.totalQuantity}
      </p>
    </div>
  )
}

export function TopProductsChart({ data, loading = false }: TopProductsChartProps) {
  const t = useTranslations("analytics")

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-4 h-5 w-48 animate-pulse rounded bg-muted" />
        <div className="h-[400px] animate-pulse rounded bg-muted/50" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold">{t("topProductsChart.title")}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{t("topProductsChart.subtitle")}</p>
        <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
          {t("topProductsChart.noData")}
        </div>
      </div>
    )
  }

  // Truncate long product names for display
  const chartData = data.map((p) => ({
    ...p,
    shortTitle: p.title.length > 20 ? p.title.slice(0, 20) + "…" : p.title,
  }))

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold">{t("topProductsChart.title")}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{t("topProductsChart.subtitle")}</p>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            />
            <YAxis
              dataKey="shortTitle"
              type="category"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={130}
            />
            <Tooltip content={<CustomTooltip t={t} />} />
            <Bar dataKey="totalRevenue" radius={[0, 4, 4, 0]} maxBarSize={28}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
