export const SALE_COUNTDOWN_CLOCK_THRESHOLD_MS = 72 * 60 * 60 * 1000
export const SALE_COUNTDOWN_DATE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000

export type SaleCountdownState =
  | { kind: "expired"; remaining_ms: 0 }
  | { kind: "date"; remaining_ms: number }
  | { kind: "days"; remaining_ms: number; days: number }
  | {
      kind: "clock"
      remaining_ms: number
      days: number
      hours: number
      minutes: number
      seconds: number
    }

export function getSaleCountdownState(
  endsAt: string,
  nowMs: number
): SaleCountdownState {
  const endMs = Date.parse(endsAt)
  const remainingMs = endMs - nowMs
  if (!Number.isFinite(endMs) || remainingMs <= 0) {
    return { kind: "expired", remaining_ms: 0 }
  }
  if (remainingMs > SALE_COUNTDOWN_DATE_THRESHOLD_MS) {
    return { kind: "date", remaining_ms: remainingMs }
  }
  if (remainingMs > SALE_COUNTDOWN_CLOCK_THRESHOLD_MS) {
    return {
      kind: "days",
      remaining_ms: remainingMs,
      days: Math.ceil(remainingMs / (24 * 60 * 60 * 1000)),
    }
  }

  const totalSeconds = Math.ceil(remainingMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return {
    kind: "clock",
    remaining_ms: remainingMs,
    days,
    hours,
    minutes,
    seconds,
  }
}

export function formatSaleCountdownClock(
  state: Extract<SaleCountdownState, { kind: "clock" }>,
  locale: string
) {
  const pad = (value: number) => String(value).padStart(2, "0")
  const clock = `${pad(state.hours)}:${pad(state.minutes)}:${pad(state.seconds)}`
  if (state.days === 0) return clock
  return locale.startsWith("en")
    ? `${pad(state.days)}d ${clock}`
    : `${pad(state.days)}天 ${clock}`
}
