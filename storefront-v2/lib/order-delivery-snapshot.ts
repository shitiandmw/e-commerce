export const SHIPPING_DELIVERY_SNAPSHOT_KEY = "shipping_delivery_snapshot"

export interface OrderDeliverySnapshot {
  version: 1
  captured_at: string
  shipping_option: {
    id: string
    name: string
    type: "pickup" | "delivery"
  }
  pickup_location: {
    id: string
    name: string
    address: string
    phone: string | null
    hours: string | null
    note: string | null
  } | null
}

export function getOrderDeliverySnapshot(order: {
  metadata?: Record<string, unknown> | null
  shipping_methods?: Array<{
    metadata?: Record<string, unknown> | null
  }>
}): OrderDeliverySnapshot | null {
  const value =
    order.metadata?.[SHIPPING_DELIVERY_SNAPSHOT_KEY] ??
    order.shipping_methods?.[0]?.metadata?.[SHIPPING_DELIVERY_SNAPSHOT_KEY]
  if (!value || typeof value !== "object") return null

  const snapshot = value as Partial<OrderDeliverySnapshot>
  return snapshot.shipping_option?.id ? (snapshot as OrderDeliverySnapshot) : null
}
