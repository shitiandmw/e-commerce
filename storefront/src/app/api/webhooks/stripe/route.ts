import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function POST(req: NextRequest) {
  // Forward raw body to Medusa webhook endpoint
  const body = await req.text()
  const signature = req.headers.get("stripe-signature") || ""

  const res = await fetch(`${MEDUSA_BACKEND_URL}/hooks/payment/stripe_stripe`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": signature,
    },
    body,
  })

  const status = res.status
  const data = await res.text().catch(() => "")
  return new NextResponse(data, { status })
}
