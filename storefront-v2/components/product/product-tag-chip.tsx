import type { CSSProperties } from "react"
import type { ProductCustomTag } from "@/lib/data/products"
import { cn } from "@/lib/utils"

function parseHexColor(color?: string | null) {
  if (!color) return null
  const trimmed = color.trim()
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(trimmed)
  if (!match) return null

  const raw = match[1]
  const hex = raw.length === 3
    ? raw.split("").map((char) => char + char).join("")
    : raw
  const value = Number.parseInt(hex, 16)

  return {
    hex: `#${hex}`,
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

function readableTextColor(color?: string | null) {
  const parsed = parseHexColor(color)
  if (!parsed) return "#ffffff"

  const luminance = (0.299 * parsed.r + 0.587 * parsed.g + 0.114 * parsed.b) / 255
  return luminance > 0.62 ? "#111827" : "#ffffff"
}

function tagStyle(tag: ProductCustomTag, variant: "badge" | "attribute"): CSSProperties {
  const parsed = parseHexColor(tag.color)
  if (!parsed) return {}

  if (variant === "badge") {
    return {
      backgroundColor: parsed.hex,
      borderColor: parsed.hex,
      color: readableTextColor(parsed.hex),
    }
  }

  return {
    borderColor: parsed.hex,
  }
}

function tagAccentStyle(color?: string | null): CSSProperties | undefined {
  const parsed = parseHexColor(color)
  return parsed ? { backgroundColor: parsed.hex } : undefined
}

export function getCustomTags(product: { custom_tags?: ProductCustomTag[] | null } | null | undefined) {
  return (product?.custom_tags ?? []).filter((tag) => tag.name)
}

export function ProductTagChip({
  tag,
  variant,
  className,
}: {
  tag: ProductCustomTag
  variant: "badge" | "attribute"
  className?: string
}) {
  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex max-w-full items-center border bg-gold/90 px-2 py-1 text-[10px] font-bold uppercase text-primary-foreground shadow-sm",
          className
        )}
        style={tagStyle(tag, variant)}
      >
        <span className="truncate">{tag.name}</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 border border-border/50 bg-background/60 px-2 py-1 text-[10px] font-medium text-muted-foreground",
        className
      )}
      style={tagStyle(tag, variant)}
    >
      <span
        className="size-1.5 shrink-0 rounded-full bg-current"
        style={tagAccentStyle(tag.color)}
        aria-hidden="true"
      />
      <span className="truncate">{tag.name}</span>
    </span>
  )
}
