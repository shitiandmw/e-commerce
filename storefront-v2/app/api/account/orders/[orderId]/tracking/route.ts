import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const token = req.headers.get("authorization")?.replace("Bearer ", "")

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/tracking/${orderId}`, {
      headers,
    })

    if (!res.ok) {
      return NextResponse.json({ tracking: [] }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ tracking: [] })
  }
}
