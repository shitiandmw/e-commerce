import { fetchContent } from "@/lib/medusa"

export interface PickupLocation {
  id: string
  name: string
  address: string
  phone?: string | null
  hours?: string | null
  note?: string | null
  sort_order: number
  is_enabled: boolean
}

interface PickupLocationsResponse {
  pickup_locations: PickupLocation[]
}

export async function fetchPickupLocations(locale?: string): Promise<PickupLocation[]> {
  try {
    const data = await fetchContent<PickupLocationsResponse>(
      "/store/content/pickup-locations",
      undefined,
      locale
    )
    return data?.pickup_locations ?? []
  } catch {
    return []
  }
}
