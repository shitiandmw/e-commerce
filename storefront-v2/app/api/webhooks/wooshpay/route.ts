import { NextRequest, NextResponse } from "next/server"

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("wooshpay-signature") || req.headers.get("Wooshpay-Signature")

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (signature) {
    headers["wooshpay-signature"] = signature
  }

  const res = await fetch(`${MEDUSA_URL}/hooks/payment/wooshpay_wooshpay`, {
    method: "POST",
    headers,
    body,
  })

  const data = await res.text()
  return new NextResponse(data, { status: res.status })
}
