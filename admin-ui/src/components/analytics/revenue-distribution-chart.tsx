"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import type { RevenueByCategoryItem } from "@/hooks/use-analytics"

interface RevenueDistributionChartProps {
  data: RevenueByCategoryItem[]
  title: string
  subtitle: string
  loading?: boolean
}

const COLORS = [
  "hsl(221.2, 83.2%, 53.3%)",
  "hsl(210, 78%, 60%)",
  "hsl(200, 74%, 55%)",
  "hsl(142, 71%, 45%)",
  "hsl(80, 50%, 45%)",
  "hsl(45, 55%, 50%)",
  "hsl(25, 60%, 52%)",
  "hsl(340, 65%, 55%)",
  "hsl(280, 55%, 55%)",
  "hsl(260, 50%, 60%)",
]

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: { name: string; revenue: number; percent?: number }
  }>
}) {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0].payload

  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="text-sm font-medium text-foreground">{item.name}</p>
      <p className="text-xs text-muted-foreground">
        Revenue: ${item.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </p>
    </div>
  )
}

export function RevenueDistributionChart({
  data,
  title,
  subtitle,
  loading = false,
}: RevenueDistributionChartProps) {
  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-4 h-5 w-48 animate-pulse rounded bg-muted" />
        <div className="h-[350px] animate-pulse rounded bg-muted/50" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold">{title}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{subtitle}</p>
        <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
          No data available for this period.
        </div>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.revenue, 0)

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold">{title}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{subtitle}</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
                dataKey="revenue"
                nameKey="name"
                strokeWidth={0}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(value) => (
                  <span className="text-xs text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Table breakdown */}
        <div className="flex flex-col justify-center">
          <div className="space-y-2">
            {data.map((item, index) => {
              const pct = total > 0 ? ((item.revenue / total) * 100).toFixed(1) : "0"
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex flex-1 items-center justify-between min-w-0">
                    <span className="text-sm truncate">{item.name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-medium">
                        ${item.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="text-sm font-bold">
                ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
