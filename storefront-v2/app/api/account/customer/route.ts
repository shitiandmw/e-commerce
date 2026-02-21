import { NextRequest } from "next/server"
import { proxyToMedusa } from "@/lib/proxy"

export async function GET(req: NextRequest) {
  return proxyToMedusa(req, "/store/customers/me")
}

export async function POST(req: NextRequest) {
  return proxyToMedusa(req, "/store/customers/me", { method: "POST" })
}
