import { NextRequest, NextResponse } from "next/server"

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action") // login, register, reset
  const body = await req.json()

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const auth = req.headers.get("authorization")
  if (auth) headers["authorization"] = auth

  let path = ""
  let isStoreRoute = false
  if (action === "login") {
    path = "/auth/customer/emailpass"
  } else if (action === "register") {
    path = "/auth/customer/emailpass/register"
  } else if (action === "reset") {
    path = "/auth/customer/emailpass/reset-password"
  } else if (action === "create-customer") {
    path = "/store/customers"
    isStoreRoute = true
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  // Only add publishable key for /store/* routes, not /auth/* routes
  if (isStoreRoute && PUBLISHABLE_KEY) {
    headers["x-publishable-api-key"] = PUBLISHABLE_KEY
  }

  const res = await fetch(`${MEDUSA_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  const data = await res.text()
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  })
}
