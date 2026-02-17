import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const url = new URL(`${MEDUSA_BACKEND_URL}/store/products`)
  searchParams.forEach((v, k) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: {
      "x-publishable-api-key": PUBLISHABLE_KEY,
      "content-type": "application/json",
    },
  })
  const data = await res.json()
  return NextResponse.json(data)
}
