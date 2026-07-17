import { NextRequest, NextResponse } from "next/server"
import { proxyToMedusa } from "@/lib/proxy"

const DEFAULT_FIELDS = [
  "+email",
  "+items",
  "+items.thumbnail",
  "+shipping_address",
  "+shipping_methods",
  "+metadata",
].join(",")

export async function GET(req: NextRequest) {
  if (!req.headers.get("authorization")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const limit = searchParams.get("limit") || "10"
  const offset = searchParams.get("offset") || "0"
  const fields = searchParams.get("fields") || DEFAULT_FIELDS
  let path = `/store/orders?limit=${limit}&offset=${offset}`
  if (fields) path += `&fields=${encodeURIComponent(fields)}`
  return proxyToMedusa(req, path)
}
