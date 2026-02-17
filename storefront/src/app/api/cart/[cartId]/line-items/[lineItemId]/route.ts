import { NextRequest } from "next/server"
import { medusaProxy } from "@/lib/medusa-proxy"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cartId: string; lineItemId: string }> }
) {
  const { cartId, lineItemId } = await params
  return medusaProxy(req, `/store/carts/${cartId}/line-items/${lineItemId}`)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ cartId: string; lineItemId: string }> }
) {
  const { cartId, lineItemId } = await params
  return medusaProxy(req, `/store/carts/${cartId}/line-items/${lineItemId}`)
}
