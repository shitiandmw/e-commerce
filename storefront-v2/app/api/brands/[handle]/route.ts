import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params
  const { searchParams } = request.nextUrl
  const brandUrl = new URL(`${MEDUSA_BACKEND_URL}/store/content/brands/${handle}`)
  searchParams.forEach((v, k) => brandUrl.searchParams.set(k, v))
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY

  const res = await fetch(brandUrl.toString(), { headers })
  if (!res.ok) return NextResponse.json({ brand: null }, { status: res.status })
  const data = await res.json()
  return NextResponse.json(data)
}
