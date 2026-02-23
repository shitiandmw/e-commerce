import { NextRequest, NextResponse } from "next/server"

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (signature) {
    headers["stripe-signature"] = signature
  }

  const res = await fetch(`${MEDUSA_URL}/hooks/payment/stripe_stripe`, {
    method: "POST",
    headers,
    body,
  })

  const data = await res.text()
  return new NextResponse(data, { status: res.status })
}
