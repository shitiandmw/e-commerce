import { NextRequest } from "next/server"
import { proxyToMedusa } from "@/lib/proxy"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return proxyToMedusa(req, `/store/customers/me/addresses/${id}`, { method: "POST" })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return proxyToMedusa(req, `/store/customers/me/addresses/${id}`, { method: "DELETE" })
}
