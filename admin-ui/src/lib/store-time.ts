export const STORE_TIME_ZONE =
  process.env.NEXT_PUBLIC_STORE_TIME_ZONE || "Asia/Shanghai"

function partsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  ) as Record<string, number>
}

export function isoToStoreDatetimeLocal(
  value?: string | null,
  timeZone = STORE_TIME_ZONE
) {
  if (!value) return ""
  const parts = partsInTimeZone(new Date(value), timeZone)
  const pad = (number: number) => String(number).padStart(2, "0")
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`
}

export function storeDatetimeLocalToIso(
  value?: string | null,
  timeZone = STORE_TIME_ZONE
) {
  if (!value) return null
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
  )
  if (!match) throw new Error("Invalid datetime-local value")
  const [, year, month, day, hour, minute, second = "0"] = match
  const localAsUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  )

  let candidate = localAsUtc
  for (let index = 0; index < 2; index += 1) {
    const parts = partsInTimeZone(new Date(candidate), timeZone)
    const representedAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    )
    candidate = localAsUtc - (representedAsUtc - candidate)
  }
  return new Date(candidate).toISOString()
}
