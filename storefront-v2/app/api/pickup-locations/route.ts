import { fetchPickupLocations } from "@/lib/data/pickup-locations"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") || undefined
  const pickup_locations = await fetchPickupLocations(locale)

  return NextResponse.json({ pickup_locations })
}
