type HeaderLike = Record<string, unknown> & {
  get?: (name: string) => unknown
}

type StoreContentLocaleRequest = {
  locale?: unknown
  query?: Record<string, unknown>
  headers?: HeaderLike
}

function firstNonEmptyString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return firstNonEmptyString(value[0])
  }

  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function readHeader(headers: HeaderLike | undefined, name: string): unknown {
  if (!headers) {
    return undefined
  }

  const fromGet = headers.get?.(name)
  if (fromGet !== undefined) {
    return fromGet
  }

  const lowerName = name.toLowerCase()
  const matchingKey = Object.keys(headers).find((key) => key.toLowerCase() === lowerName)
  return matchingKey ? headers[matchingKey] : undefined
}

export function getStoreContentLocale(req: StoreContentLocaleRequest): string | undefined {
  return (
    firstNonEmptyString(req.locale) ??
    firstNonEmptyString(req.query?.locale) ??
    firstNonEmptyString(readHeader(req.headers, "x-medusa-locale"))
  )
}
