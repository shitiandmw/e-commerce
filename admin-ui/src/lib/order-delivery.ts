import type { AdminOrder } from "@/lib/admin-api"

export type OrderDeliveryType = "pickup" | "delivery"

export type ShippingOptionDeliveryInfo = {
  id: string
  name?: string | null
  metadata?: {
    type?: unknown
    [key: string]: unknown
  } | null
}

const PICKUP_ADDRESS_SENTINELS = ["pickup order"]
const PICKUP_NAME_MARKERS = ["pickup", "pick-up", "self-pick", "自提", "自取"]
const SHIPPING_DELIVERY_SNAPSHOT_KEY = "shipping_delivery_snapshot"

export type OrderDeliverySnapshot = {
  version: 1
  captured_at: string
  shipping_option: {
    id: string
    name: string
    type: OrderDeliveryType
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

export function getOrderDeliverySnapshot(
  order: AdminOrder
): OrderDeliverySnapshot | null {
  const value =
    order.metadata?.[SHIPPING_DELIVERY_SNAPSHOT_KEY] ??
    order.shipping_methods?.[0]?.metadata?.[SHIPPING_DELIVERY_SNAPSHOT_KEY]
  if (!value || typeof value !== "object") return null

  const snapshot = value as Partial<OrderDeliverySnapshot>
  return snapshot.shipping_option?.id ? (snapshot as OrderDeliverySnapshot) : null
}

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function normalizeDeliveryType(value: unknown): OrderDeliveryType | null {
  const normalized = normalize(value)
  if (normalized === "pickup") return "pickup"
  if (normalized === "delivery") return "delivery"
  return null
}

export function getPrimaryShippingMethod(order: AdminOrder) {
  return order.shipping_methods?.[0] ?? null
}

function getShippingOptionById(
  shippingOptions: ShippingOptionDeliveryInfo[] | undefined,
  id?: string | null
) {
  return id ? shippingOptions?.find((option) => option.id === id) : undefined
}

export function getRawShippingMethodName(
  order: AdminOrder,
  shippingOptions?: ShippingOptionDeliveryInfo[]
) {
  const snapshot = getOrderDeliverySnapshot(order)
  if (snapshot) return snapshot.shipping_option.name
  const method = getPrimaryShippingMethod(order)
  const option = getShippingOptionById(shippingOptions, method?.shipping_option_id)
  const pickupName =
    normalize(order.shipping_address?.address_1) === "pickup order"
      ? order.shipping_address?.address_2
      : ""

  return method?.name || method?.shipping_option?.name || option?.name || pickupName || ""
}

export function getShippingMethodName(
  order: AdminOrder,
  shippingOptions?: ShippingOptionDeliveryInfo[]
) {
  return getRawShippingMethodName(order, shippingOptions).trim()
}

export function getOrderDeliveryType(
  order: AdminOrder,
  shippingOptions?: ShippingOptionDeliveryInfo[]
): OrderDeliveryType {
  const snapshot = getOrderDeliverySnapshot(order)
  if (snapshot) return snapshot.shipping_option.type

  for (const method of order.shipping_methods ?? []) {
    const metadataType = normalizeDeliveryType(method.metadata?.type)
    if (metadataType) return metadataType

    const optionMetadataType = normalizeDeliveryType(
      method.shipping_option?.metadata?.type
    )
    if (optionMetadataType) return optionMetadataType

    const linkedOptionMetadataType = normalizeDeliveryType(
      getShippingOptionById(shippingOptions, method.shipping_option_id)?.metadata
        ?.type
    )
    if (linkedOptionMetadataType) return linkedOptionMetadataType
  }

  const addressLine = normalize(order.shipping_address?.address_1)
  if (PICKUP_ADDRESS_SENTINELS.includes(addressLine)) {
    return "pickup"
  }

  const methodName = normalize(getRawShippingMethodName(order, shippingOptions))
  if (PICKUP_NAME_MARKERS.some((marker) => methodName.includes(marker))) {
    return "pickup"
  }

  return "delivery"
}

export function isPickupOrder(
  order: AdminOrder,
  shippingOptions?: ShippingOptionDeliveryInfo[]
) {
  return getOrderDeliveryType(order, shippingOptions) === "pickup"
}
