import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const url = new URL(`${MEDUSA_BACKEND_URL}/store/content/brands`)
  searchParams.forEach((v, k) => url.searchParams.set(k, v))

  const headers: Record<string, string> = { "content-type": "application/json" }
  if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY

  const res = await fetch(url.toString(), { headers })
  if (!res.ok) return NextResponse.json({ brands: [], count: 0 }, { status: res.status })
  const data = await res.json()
  return NextResponse.json(data)
}
