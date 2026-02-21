import { NextRequest, NextResponse } from "next/server"
import { medusaProxy } from "@/lib/medusa-proxy"

export async function POST(req: NextRequest) {
  try {
    return await medusaProxy(req, "/store/carts")
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
