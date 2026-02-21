import { NextRequest } from "next/server"
import { proxyToMedusa } from "@/lib/proxy"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = searchParams.get("limit") || "10"
  const offset = searchParams.get("offset") || "0"
  const fields = searchParams.get("fields") || ""
  let path = `/store/orders?limit=${limit}&offset=${offset}`
  if (fields) path += `&fields=${fields}`
  return proxyToMedusa(req, path)
}
