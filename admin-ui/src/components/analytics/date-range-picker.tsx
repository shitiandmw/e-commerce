"use client"

import { useState } from "react"
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear } from "date-fns"
import type { DateGranularity } from "@/hooks/use-analytics"

interface DateRangePickerProps {
  from: Date
  to: Date
  granularity: DateGranularity
  onRangeChange: (from: Date, to: Date) => void
  onGranularityChange: (g: DateGranularity) => void
}

const presets = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 3 months", value: "3m" },
  { label: "Last 6 months", value: "6m" },
  { label: "Last 12 months", value: "12m" },
  { label: "This month", value: "this_month" },
  { label: "Year to date", value: "ytd" },
] as const

export function DateRangePicker({
  from,
  to,
  granularity,
  onRangeChange,
  onGranularityChange,
}: DateRangePickerProps) {
  const [activePreset, setActivePreset] = useState("30d")

  const handlePreset = (preset: string) => {
    const now = new Date()
    let newFrom: Date
    let newTo: Date = now

    switch (preset) {
      case "7d":
        newFrom = subDays(now, 7)
        break
      case "30d":
        newFrom = subDays(now, 30)
        break
      case "3m":
        newFrom = subMonths(now, 3)
        break
      case "6m":
        newFrom = subMonths(now, 6)
        break
      case "12m":
        newFrom = subMonths(now, 12)
        break
      case "this_month":
        newFrom = startOfMonth(now)
        newTo = endOfMonth(now)
        break
      case "ytd":
        newFrom = startOfYear(now)
        break
      default:
        return
    }

    // Auto-select granularity
    if (preset === "7d") {
      onGranularityChange("day")
    } else if (preset === "30d" || preset === "this_month") {
      onGranularityChange("day")
    } else {
      onGranularityChange("month")
    }

    setActivePreset(preset)
    onRangeChange(newFrom, newTo)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Presets */}
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePreset(p.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activePreset === p.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Granularity */}
      <div className="flex items-center gap-1 rounded-md border bg-card p-0.5">
        {(["day", "week", "month"] as DateGranularity[]).map((g) => (
          <button
            key={g}
            onClick={() => onGranularityChange(g)}
            className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
              granularity === g
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Date display */}
      <span className="text-xs text-muted-foreground">
        {format(from, "MMM d, yyyy")} – {format(to, "MMM d, yyyy")}
      </span>
    </div>
  )
}
