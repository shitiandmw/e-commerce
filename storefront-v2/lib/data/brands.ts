import { type MedusaBrand } from "./products"

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

interface BrandWithProducts extends MedusaBrand {
  products?: { id: string }[]
}

interface BrandResponse {
  brand: BrandWithProducts | null
}

/**
 * Fetch a single brand by ID from Medusa Store API.
 * Returns brand info + associated product IDs.
 */
export async function fetchBrand(id: string): Promise<BrandWithProducts | null> {
  const url = new URL(`${MEDUSA_BACKEND_URL}/store/content/brands/${id}`)
  const headers: Record<string, string> = {}
  if (PUBLISHABLE_KEY) {
    headers["x-publishable-api-key"] = PUBLISHABLE_KEY
  }

  try {
    const res = await fetch(url.toString(), {
      headers,
      next: { revalidate: 30 },
    })
    if (!res.ok) return null
    const data: BrandResponse = await res.json()
    return data.brand ?? null
  } catch {
    return null
  }
}
