import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function POST(req: NextRequest, { params }: { params: Promise<{ cartId: string }> }) {
  const { cartId } = await params
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-publishable-api-key": PUBLISHABLE_KEY,
  }

  try {
    // Step 1: Get cart to find payment_collection id
    const cartRes = await fetch(
      `${MEDUSA_BACKEND_URL}/store/carts/${cartId}?fields=+payment_collection.id`,
      { headers }
    )
    const cartData = await cartRes.json().catch(() => ({}))
    let paymentCollectionId = cartData?.cart?.payment_collection?.id

    // Step 2: Create payment collection if it doesn't exist
    if (!paymentCollectionId) {
      const createRes = await fetch(
        `${MEDUSA_BACKEND_URL}/store/payment-collections`,
        { method: "POST", headers, body: JSON.stringify({ cart_id: cartId }) }
      )
      const createData = await createRes.json().catch(() => ({}))
      paymentCollectionId = createData?.payment_collection?.id
    }

    if (!paymentCollectionId) {
      return NextResponse.json(
        { message: "Failed to create payment collection" },
        { status: 500 }
      )
    }

    // Step 3: Create payment session on the payment collection
    const body = await req.text().catch(() => "{}")
    const sessionRes = await fetch(
      `${MEDUSA_BACKEND_URL}/store/payment-collections/${paymentCollectionId}/payment-sessions`,
      { method: "POST", headers, body }
    )
    const sessionData = await sessionRes.json().catch(() => ({}))

    if (!sessionRes.ok) {
      return NextResponse.json(sessionData, { status: sessionRes.status })
    }

    // Return the payment collection data wrapped in a cart-like response
    return NextResponse.json({
      cart: {
        ...cartData.cart,
        payment_collection: sessionData.payment_collection,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Payment session init failed" },
      { status: 500 }
    )
  }
}
