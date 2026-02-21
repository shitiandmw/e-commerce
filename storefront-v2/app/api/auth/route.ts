import { NextRequest, NextResponse } from "next/server"

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

const ACTION_MAP: Record<string, { path: string; isStore?: boolean }> = {
  login: { path: "/auth/customer/emailpass" },
  register: { path: "/auth/customer/emailpass/register" },
  reset: { path: "/auth/customer/emailpass/reset-password" },
  "create-customer": { path: "/store/customers", isStore: true },
}

async function proxyAuth(req: NextRequest, path: string, isStore: boolean, method?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const auth = req.headers.get("authorization")
  if (auth) headers["authorization"] = auth
  // Only add publishable key for /store/* routes
  if (isStore && PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY

  const reqMethod = method || req.method
  const res = await fetch(`${MEDUSA_URL}${path}`, {
    method: reqMethod,
    headers,
    body: reqMethod !== "GET" && reqMethod !== "HEAD" ? await req.text() || undefined : undefined,
  })

  const data = await res.text()
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  })
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action")
  if (!action || !ACTION_MAP[action]) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }
  const { path, isStore } = ACTION_MAP[action]
  return proxyAuth(req, path, !!isStore)
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action")
  if (action === "me") {
    return proxyAuth(req, "/store/customers/me", true, "GET")
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
