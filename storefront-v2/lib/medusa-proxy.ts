import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function medusaProxy(request: NextRequest, medusaPath: string) {
  const url = new URL(`${MEDUSA_BACKEND_URL}${medusaPath}`)
  request.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v))

  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-publishable-api-key": PUBLISHABLE_KEY,
  }

  const opts: RequestInit = { method: request.method, headers }
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const body = await request.text()
      if (body) opts.body = body
    } catch { /* empty body */ }
  }

  const res = await fetch(url.toString(), opts)
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
