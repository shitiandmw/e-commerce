import { NextRequest } from "next/server"
import { proxyToMedusa } from "@/lib/proxy"

export async function GET(req: NextRequest) {
  return proxyToMedusa(req, "/store/wishlist")
}

export async function POST(req: NextRequest) {
  return proxyToMedusa(req, "/store/wishlist", { method: "POST" })
}
