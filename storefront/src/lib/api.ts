const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function fetchContent<T>(
  path: string,
  params?: Record<string, string | number>
): Promise<T> {
  const url = new URL(`${MEDUSA_BACKEND_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value))
      }
    })
  }
  const res = await fetch(url.toString(), {
    headers: {
      "x-publishable-api-key": PUBLISHABLE_KEY,
    },
    next: { revalidate: 60 },
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }
  return res.json()
}
