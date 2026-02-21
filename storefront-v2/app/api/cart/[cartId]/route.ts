import { NextRequest } from "next/server"
import { medusaProxy } from "@/lib/medusa-proxy"

export async function GET(req: NextRequest, { params }: { params: Promise<{ cartId: string }> }) {
  const { cartId } = await params
  return medusaProxy(req, `/store/carts/${cartId}`)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ cartId: string }> }) {
  const { cartId } = await params
  return medusaProxy(req, `/store/carts/${cartId}`)
}
