import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const url = new URL(`${MEDUSA_BACKEND_URL}/store/products`)

  const locale = searchParams.get("locale")
  searchParams.forEach((v, k) => {
    if (k !== "locale") url.searchParams.set(k, v)
  })

  const headers: Record<string, string> = {
    "x-publishable-api-key": PUBLISHABLE_KEY,
    "content-type": "application/json",
  }
  if (locale) headers["x-medusa-locale"] = locale

  const res = await fetch(url.toString(), { headers })
  const data = await res.json()
  return NextResponse.json(data)
}
