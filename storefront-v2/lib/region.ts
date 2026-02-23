const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

let cached: { id: string; currency_code: string } | null = null

/**
 * Get the default region. Works both server-side and client-side.
 * Server-side: calls Medusa backend directly.
 * Client-side: calls /api/regions proxy.
 */
export async function getRegion(): Promise<{ id: string; currency_code: string }> {
  if (cached) return cached

  const isServer = typeof window === "undefined"
  const url = isServer
    ? `${MEDUSA_BACKEND_URL}/store/regions`
    : "/api/regions"

  try {
    const headers: Record<string, string> = {}
    if (isServer && PUBLISHABLE_KEY) {
      headers["x-publishable-api-key"] = PUBLISHABLE_KEY
    }
    const res = await fetch(url, {
      headers,
      ...(isServer ? { next: { revalidate: 60 } } : {}),
    })
    if (!res.ok) return { id: "", currency_code: "usd" }
    const data = await res.json()
    const region = data.regions?.[0]
    if (region) {
      cached = { id: region.id, currency_code: region.currency_code }
      return cached
    }
  } catch {
    // fallback
  }
  return { id: "", currency_code: "usd" }
}

export function clearRegionCache() {
  cached = null
}
