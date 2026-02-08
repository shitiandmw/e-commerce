"use client"

import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  change?: number
  loading?: boolean
  prefix?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  loading = false,
  prefix,
}: StatCardProps) {
  const isPositive = (change ?? 0) >= 0

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="rounded-md bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <div className="mt-3">
        {loading ? (
          <div className="space-y-2">
            <div className="h-7 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <>
            <p className="text-2xl font-bold">
              {prefix}
              {value}
            </p>
            {change !== undefined && (
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  isPositive ? "text-emerald-600" : "text-red-600"
                )}
              >
                {isPositive ? "+" : ""}
                {change}% from last month
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
