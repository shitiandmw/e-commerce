import { medusaProxy } from "@/lib/medusa-proxy"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  return medusaProxy(req, "/store/payment-methods")
}
