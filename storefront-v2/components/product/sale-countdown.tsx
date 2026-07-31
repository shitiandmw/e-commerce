"use client"

import { useEffect, useRef, useState } from "react"
import { Clock3 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import {
  formatSaleCountdownClock,
  getSaleCountdownState,
} from "@/lib/sale-countdown"
import { cn } from "@/lib/utils"

type SaleCountdownProps = {
  status: "active" | "scheduled"
  startsAt?: string | null
  endsAt?: string | null
  serverTime: string
  compact?: boolean
  onExpire?: () => void
}

export function SaleCountdown({
  status,
  startsAt,
  endsAt,
  serverTime,
  compact = false,
  onExpire,
}: SaleCountdownProps) {
  const t = useTranslations()
  const locale = useLocale()
  const initialServerTime = Date.parse(serverTime)
  const [nowMs, setNowMs] = useState(() => initialServerTime)
  const onExpireRef = useRef(onExpire)
  const expirationHandledRef = useRef(false)

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    const serverNow = Date.parse(serverTime)
    if (!Number.isFinite(serverNow)) return
    const startedAt = performance.now()
    expirationHandledRef.current = false
    setNowMs(serverNow)
    const timer = window.setInterval(() => {
      setNowMs(serverNow + performance.now() - startedAt)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [endsAt, serverTime])

  const formatDate = (value: string) => new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))

  const countdown = status === "active" && endsAt
    ? getSaleCountdownState(endsAt, nowMs)
    : null

  useEffect(() => {
    if (countdown?.kind !== "expired" || expirationHandledRef.current) return
    expirationHandledRef.current = true
    onExpireRef.current?.()
  }, [countdown?.kind])

  if (status === "scheduled" && startsAt) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock3 className="size-3.5 shrink-0 text-gold/80" />
        <span>{t("sale_starts_on", { date: formatDate(startsAt) })}</span>
      </div>
    )
  }
  if (status !== "active" || !endsAt) return null
  if (!countdown || countdown.kind === "expired") return null

  let message: string
  if (countdown.kind === "date") {
    message = t(compact ? "cart_sale_ends_on" : "sale_ends_on", {
      date: formatDate(endsAt),
    })
  } else if (countdown.kind === "days") {
    message = t(compact ? "cart_sale_days_remaining" : "sale_days_remaining", {
      days: countdown.days,
    })
  } else {
    message = t(
      compact ? "cart_sale_countdown_remaining" : "sale_countdown_remaining",
      { time: formatSaleCountdownClock(countdown, locale) }
    )
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-gold",
        compact ? "mt-1 justify-end text-[0.6875rem]" : "mt-2 text-xs"
      )}
    >
      <Clock3 className="size-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
