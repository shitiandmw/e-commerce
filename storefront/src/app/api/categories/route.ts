import { NextResponse } from "next/server"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function GET() {
  const res = await fetch(`${MEDUSA_BACKEND_URL}/store/product-categories?limit=100`, {
    headers: {
      "x-publishable-api-key": PUBLISHABLE_KEY,
      "content-type": "application/json",
    },
  })
  const data = await res.json()
  return NextResponse.json(data)
}
