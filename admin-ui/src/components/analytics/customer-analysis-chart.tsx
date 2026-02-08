"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import type { CustomerSegment } from "@/hooks/use-analytics"

interface CustomerAnalysisChartProps {
  segments: CustomerSegment[]
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  avgLTV: number
  loading?: boolean
}

const COLORS = ["hsl(221.2, 83.2%, 53.3%)", "hsl(142, 71%, 45%)"]

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { percent: number } }>
}) {
  if (!active || !payload || payload.length === 0) return null
  const { name, value } = payload[0]

  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="text-sm font-medium text-foreground">{name}</p>
      <p className="text-xs text-muted-foreground">{value} customers</p>
    </div>
  )
}

export function CustomerAnalysisChart({
  segments,
  totalCustomers,
  newCustomers,
  returningCustomers,
  avgLTV,
  loading = false,
}: CustomerAnalysisChartProps) {
  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-4 h-5 w-48 animate-pulse rounded bg-muted" />
        <div className="h-[350px] animate-pulse rounded bg-muted/50" />
      </div>
    )
  }

  const hasData = segments.some((s) => s.value > 0)

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold">Customer Analysis</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Customer segmentation and lifetime value
      </p>

      {!hasData ? (
        <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
          No customer data available for this period.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Pie chart */}
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={0}
                >
                  {segments.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(value) => (
                    <span className="text-xs text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* KPI cards */}
          <div className="flex flex-col justify-center space-y-4">
            <div className="rounded-md border p-4">
              <p className="text-xs font-medium text-muted-foreground">Total Customers</p>
              <p className="mt-1 text-2xl font-bold">{totalCustomers.toLocaleString()}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md border p-4">
                <p className="text-xs font-medium text-muted-foreground">New</p>
                <p className="mt-1 text-xl font-bold text-blue-600">{newCustomers}</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-xs font-medium text-muted-foreground">Returning</p>
                <p className="mt-1 text-xl font-bold text-emerald-600">{returningCustomers}</p>
              </div>
            </div>
            <div className="rounded-md border p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Avg. Customer Lifetime Value
              </p>
              <p className="mt-1 text-2xl font-bold">
                ${avgLTV.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
