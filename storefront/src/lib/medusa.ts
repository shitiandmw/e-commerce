import Medusa from "@medusajs/js-sdk"

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: PUBLISHABLE_KEY,
})

// Helper for fetching from custom store content API routes
export async function fetchContent<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${MEDUSA_BACKEND_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") url.searchParams.set(k, v)
    })
  }
  const headers: Record<string, string> = {}
  if (PUBLISHABLE_KEY) {
    headers["x-publishable-api-key"] = PUBLISHABLE_KEY
  }
  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 30 },
  })
  if (!res.ok) {
    if (res.status === 404) return null as T
    throw new Error(`API error: ${res.status}`)
  }
  return res.json()
}
