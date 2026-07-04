import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export function getStoreHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-publishable-api-key": PUBLISHABLE_KEY,
  }

  const authHeader = req.headers.get("authorization")
  if (authHeader) headers.authorization = authHeader

  return headers
}

export async function validateCustomerAuth(req: NextRequest): Promise<NextResponse | null> {
  const authHeader = req.headers.get("authorization")
  if (!authHeader) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const res = await fetch(`${MEDUSA_BACKEND_URL}/store/customers/me`, {
    headers: getStoreHeaders(req),
    cache: "no-store",
  })

  if (res.ok) return null

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(
    data?.message ? data : { message: "Unauthorized" },
    { status: res.status === 401 ? 401 : res.status }
  )
}
