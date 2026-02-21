import { NextRequest, NextResponse } from "next/server"

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function proxyToMedusa(req: NextRequest, path: string, options?: { method?: string; body?: unknown }) {
  const method = options?.method || req.method
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY
  const auth = req.headers.get("authorization")
  if (auth) headers["authorization"] = auth

  const res = await fetch(`${MEDUSA_URL}${path}`, {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : method !== "GET" && method !== "DELETE" ? await req.text() || undefined : undefined,
  })

  const data = await res.text()
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  })
}
