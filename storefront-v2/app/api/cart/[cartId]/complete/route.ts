import { NextRequest, NextResponse } from "next/server"
import { medusaProxy } from "@/lib/medusa-proxy"
import { getStoreHeaders, validateCustomerAuth } from "@/lib/store-auth"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

type PaymentSession = {
  provider_id?: string | null
  status?: string | null
  created_at?: string | null
}

type CartWithPaymentCollection = {
  payment_collection?: PaymentCollection | PaymentCollection[] | null
}

type PaymentCollection = {
  payment_sessions?: PaymentSession[]
}

function getCurrentProviderId(cart: CartWithPaymentCollection | null): string | null {
  const collections = Array.isArray(cart?.payment_collection)
    ? cart.payment_collection
    : cart?.payment_collection
      ? [cart.payment_collection]
      : []
  const sessions = collections.flatMap((collection) => {
    return Array.isArray(collection.payment_sessions) ? collection.payment_sessions : []
  })
  if (sessions.length === 0) return null

  const activeSessions = sessions
    .map((session, index) => ({ session, index }))
    .filter(({ session }) => {
      const status = String(session.status ?? "").toLowerCase()
      return !["canceled", "cancelled", "error", "failed"].includes(status)
    })
  const candidates = activeSessions.length > 0
    ? activeSessions
    : sessions.map((session, index) => ({ session, index }))
  const latest = [...candidates].sort((a, b) => {
    const aTime = Date.parse(a.session.created_at ?? "")
    const bTime = Date.parse(b.session.created_at ?? "")
    if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
      return bTime - aTime
    }
    return b.index - a.index
  })[0]

  return typeof latest?.session.provider_id === "string" ? latest.session.provider_id : null
}

async function fetchCartWithPaymentSessions(
  cartId: string,
  headers: Record<string, string>
): Promise<CartWithPaymentCollection | null> {
  const fieldSets = [
    "+payment_collection.id,+payment_collection.payment_sessions.id,+payment_collection.payment_sessions.provider_id,+payment_collection.payment_sessions.status,+payment_collection.payment_sessions.created_at",
    "+payment_collection.*,+payment_collection.payment_sessions.*",
  ]

  for (const fields of fieldSets) {
    const url = new URL(`${MEDUSA_BACKEND_URL}/store/carts/${cartId}`)
    url.searchParams.set("fields", fields)
    const res = await fetch(url.toString(), { headers, cache: "no-store" })
    const data = await res.json().catch(() => ({}))
    const paymentCollection = data?.cart?.payment_collection
    const hasPaymentSessions = Array.isArray(paymentCollection)
      ? paymentCollection.some((collection) => Array.isArray(collection?.payment_sessions))
      : Array.isArray(paymentCollection?.payment_sessions)
    if (res.ok && hasPaymentSessions) {
      return data.cart
    }
  }

  return null
}

async function assertPaymentProviderEnabled(req: NextRequest, cartId: string): Promise<NextResponse | null> {
  const headers = getStoreHeaders(req)
  const cart = await fetchCartWithPaymentSessions(cartId, headers)
  const providerId = getCurrentProviderId(cart)

  if (!providerId) {
    return NextResponse.json(
      { message: "No active payment session found for this cart" },
      { status: 400 }
    )
  }

  const methodsRes = await fetch(`${MEDUSA_BACKEND_URL}/store/payment-methods`, {
    headers,
    cache: "no-store",
  })
  const methodsData = await methodsRes.json().catch(() => ({}))
  if (!methodsRes.ok) {
    return NextResponse.json(methodsData, { status: methodsRes.status })
  }

  const enabledProviderIds = new Set(
    (methodsData.payment_methods ?? [])
      .map((method: { provider_id?: unknown }) => method.provider_id)
      .filter((id: unknown): id is string => typeof id === "string")
  )

  if (!enabledProviderIds.has(providerId)) {
    return NextResponse.json(
      { message: "Payment provider is disabled" },
      { status: 403 }
    )
  }

  return null
}

async function transferCartToCustomer(req: NextRequest, cartId: string): Promise<NextResponse | null> {
  const authHeader = req.headers.get("authorization")
  if (!authHeader) return null

  const headers = getStoreHeaders(req)
  const res = await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cartId}/customer`, {
    method: "POST",
    headers,
    cache: "no-store",
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(
      data?.message ? data : { message: "Failed to attach cart to customer" },
      { status: res.status }
    )
  }

  return null
}

async function prepareShippingSnapshot(
  req: NextRequest,
  cartId: string
): Promise<NextResponse | null> {
  const res = await fetch(
    `${MEDUSA_BACKEND_URL}/store/carts/${cartId}/shipping-availability/prepare`,
    { method: "POST", headers: getStoreHeaders(req), cache: "no-store" }
  )
  if (res.ok) return null

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ cartId: string }> }) {
  const { cartId } = await params
  const authError = await validateCustomerAuth(req)
  if (authError) return authError

  const transferError = await transferCartToCustomer(req, cartId)
  if (transferError) return transferError

  const shippingError = await prepareShippingSnapshot(req, cartId)
  if (shippingError) return shippingError

  const providerError = await assertPaymentProviderEnabled(req, cartId)
  if (providerError) return providerError

  return medusaProxy(req, `/store/carts/${cartId}/complete`)
}
