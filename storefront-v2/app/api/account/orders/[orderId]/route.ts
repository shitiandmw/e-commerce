import { NextRequest } from "next/server"
import { proxyToMedusa } from "@/lib/proxy"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  return proxyToMedusa(req, `/store/orders/${orderId}`)
}
