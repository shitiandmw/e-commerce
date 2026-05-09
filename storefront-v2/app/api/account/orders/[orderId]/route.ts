import { NextRequest } from "next/server"
import { proxyToMedusa } from "@/lib/proxy"

const DETAIL_FIELDS = [
  "+email",
  "+items",
  "+items.thumbnail",
  "+shipping_address",
  "+shipping_methods",
].join(",")

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const { searchParams } = new URL(req.url)
  const fields = searchParams.get("fields") || DETAIL_FIELDS
  return proxyToMedusa(req, `/store/orders/${orderId}?fields=${encodeURIComponent(fields)}`)
}
