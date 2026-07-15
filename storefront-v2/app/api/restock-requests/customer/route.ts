import { NextRequest } from "next/server"
import { medusaProxy } from "@/lib/medusa-proxy"

export async function GET(req: NextRequest) {
  return medusaProxy(req, "/store/restock-requests/customer")
}
export async function POST(req: NextRequest) {
  return medusaProxy(req, "/store/restock-requests/customer")
}
