import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { listShippingOptionsForCartWorkflow } from "@medusajs/medusa/core-flows"
import { PICKUP_LOCATION_MODULE } from "../modules/pickup-location"
import type PickupLocationModuleService from "../modules/pickup-location/service"
import { SHIPPING_AVAILABILITY_MODULE } from "../modules/shipping-availability"
import type ShippingAvailabilityModuleService from "../modules/shipping-availability/service"

export const SHIPPING_AVAILABILITY_ERROR_CODES = {
  EMPTY_CART: "SHIPPING_EMPTY_CART",
  OPTION_REQUIRED: "SHIPPING_OPTION_REQUIRED",
  OPTION_NOT_FOUND: "SHIPPING_OPTION_NOT_FOUND",
  OPTION_UNAVAILABLE: "SHIPPING_OPTION_UNAVAILABLE",
  OPTION_INCOMPATIBLE: "SHIPPING_OPTION_INCOMPATIBLE",
  PICKUP_LOCATION_REQUIRED: "PICKUP_LOCATION_REQUIRED",
  PICKUP_LOCATION_NOT_FOUND: "PICKUP_LOCATION_NOT_FOUND",
  PICKUP_LOCATION_DISABLED: "PICKUP_LOCATION_DISABLED",
  PICKUP_LOCATION_ALREADY_BOUND: "PICKUP_LOCATION_ALREADY_BOUND",
  SHIPPING_OPTION_SERVICE_ZONE_INVALID:
    "SHIPPING_OPTION_SERVICE_ZONE_INVALID",
  PICKUP_CONTACT_INVALID: "PICKUP_CONTACT_INVALID",
  SHIPPING_OPTION_IN_USE: "SHIPPING_OPTION_IN_USE",
  PICKUP_LOCATION_IN_USE: "PICKUP_LOCATION_IN_USE",
  SNAPSHOT_REQUIRED: "SHIPPING_SNAPSHOT_REQUIRED",
  SAFE_DELETE_REQUIRED: "SHIPPING_OPTION_SAFE_DELETE_REQUIRED",
  SHIPPING_ADDRESS_INVALID: "SHIPPING_ADDRESS_INVALID",
  PAYMENT_COLLECTION_CART_NOT_FOUND:
    "SHIPPING_PAYMENT_COLLECTION_CART_NOT_FOUND",
  PRODUCT_OPTIONS_SYNC_CONFLICT: "PRODUCT_SHIPPING_OPTIONS_SYNC_CONFLICT",
  INCOMPATIBLE_ITEMS_KEEP_ONE: "SHIPPING_INCOMPATIBLE_ITEMS_KEEP_ONE",
  INCOMPATIBLE_ITEMS_CHANGED: "SHIPPING_INCOMPATIBLE_ITEMS_CHANGED",
} as const

export const SHIPPING_DELIVERY_SNAPSHOT_KEY = "shipping_delivery_snapshot"

export type PickupLocationSnapshot = {
  id: string
  name: string
  address: string
  country_code: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  phone: string | null
  hours: string | null
  note: string | null
}

export type ShippingDeliverySnapshot = {
  version: 1
  captured_at: string
  shipping_option: {
    id: string
    name: string
    type: "pickup" | "delivery"
  }
  pickup_location: PickupLocationSnapshot | null
}

export type IncompatibleCartItem = {
  line_item_id: string
  product_id: string
  title: string
  thumbnail: string | null
  quantity: number
}

export type ShippingOptionCompatibility = {
  id: string
  name: string
  amount: number
  price_type?: string
  provider_id?: string
  metadata?: Record<string, unknown> | null
  is_pickup: boolean
  core_available: boolean
  is_compatible: boolean
  pickup_location_valid: boolean
  pickup_location: PickupLocationSnapshot | null
  incompatible_items: IncompatibleCartItem[]
  unavailable_reason: string | null
}

export type CartShippingAvailability = {
  cart_id: string
  item_count: number
  shipping_options: ShippingOptionCompatibility[]
  selected_shipping_option_id: string | null
  cart: any
}

export type ShippingOptionServiceZoneAddress = {
  country_code: string
  province: string | null
  city: string | null
  postal_code: string | null
}

type ShippingErrorDetails = Record<string, unknown>

export function createShippingAvailabilityError(
  code: string,
  message: string,
  details: ShippingErrorDetails = {},
  type: string = MedusaError.Types.CONFLICT
) {
  const error = new MedusaError(type as any, message, code)
  Object.assign(error, {
    shipping_code: code,
    details,
    status: 409,
  })
  return error
}

export function sendShippingAvailabilityError(res: any, error: unknown) {
  const shippingCode = (error as any)?.shipping_code
  if (!shippingCode) return false

  res.status((error as any).status || 400).json({
    code: shippingCode,
    message:
      typeof (error as any)?.message === "string"
        ? (error as any).message
        : "Shipping validation failed",
    details: (error as any).details || {},
  })
  return true
}

export function normalizeShippingOptionIds(ids: string[]) {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)))
}

export function diffProductShippingOptionLinks(
  existing: Array<{ id: string; shipping_option_id: string }>,
  nextOptionIds: string[]
) {
  const ids = normalizeShippingOptionIds(nextOptionIds)
  const next = new Set(ids)
  const current = new Set(existing.map((link) => link.shipping_option_id))
  return {
    ids,
    toDelete: existing.filter((link) => !next.has(link.shipping_option_id)),
    toCreate: ids.filter((id) => !current.has(id)),
  }
}

export function getIncompatibleCartItems(
  items: any[],
  allowedOptionsByProduct: Map<string, Set<string>>,
  shippingOptionId: string
): IncompatibleCartItem[] {
  return items.flatMap((item: any) => {
    const productId = item.product_id || item.variant?.product?.id
    const allowed = allowedOptionsByProduct.get(productId)
    if (allowed?.has(shippingOptionId)) return []

    return [{
      line_item_id: item.id,
      product_id: productId,
      title: item.product_title || item.variant?.product?.title || item.title,
      thumbnail: item.thumbnail ?? null,
      quantity: item.quantity,
    } satisfies IncompatibleCartItem]
  })
}

export function validateIncompatibleItemRemoval(
  availability: CartShippingAvailability,
  shippingOptionId: string,
  requestedLineItemIds: string[]
) {
  const lineItemIds = normalizeShippingOptionIds(requestedLineItemIds)
  const currentLineItemIds = normalizeShippingOptionIds(
    (availability.cart.items ?? []).map((item: any) => item.id)
  )
  const currentLineItemIdSet = new Set(currentLineItemIds)
  const option = availability.shipping_options.find(
    (candidate) => candidate.id === shippingOptionId
  )

  if (!option) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.OPTION_UNAVAILABLE,
      "The selected shipping option is not available for this cart.",
      { shipping_option_id: shippingOptionId }
    )
  }

  const incompatibleLineItemIds = normalizeShippingOptionIds(
    option.incompatible_items.map((item) => item.line_item_id)
  )
  const incompatibleLineItemIdSet = new Set(incompatibleLineItemIds)
  const invalidLineItemIds = lineItemIds.filter(
    (id) =>
      !currentLineItemIdSet.has(id) || !incompatibleLineItemIdSet.has(id)
  )

  if (lineItemIds.length === 0 || invalidLineItemIds.length > 0) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.INCOMPATIBLE_ITEMS_CHANGED,
      "The cart or incompatible items changed. Refresh checkout and try again.",
      {
        shipping_option_id: shippingOptionId,
        invalid_line_item_ids: invalidLineItemIds,
        incompatible_line_item_ids: incompatibleLineItemIds,
      }
    )
  }

  const remainingLineItemCount = currentLineItemIds.length - lineItemIds.length
  if (remainingLineItemCount < 1) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.INCOMPATIBLE_ITEMS_KEEP_ONE,
      "Checkout must retain at least one cart item. Choose another shipping option or return to your cart.",
      {
        shipping_option_id: shippingOptionId,
        line_item_ids: lineItemIds,
        item_count: currentLineItemIds.length,
        remaining_item_count: remainingLineItemCount,
      }
    )
  }

  return lineItemIds
}

function isPickupOption(option: any) {
  return String(option?.metadata?.type || "").toLowerCase() === "pickup"
}

function getOptionAmount(option: any, currencyCode?: string) {
  if (typeof option.amount === "number") return option.amount
  if (typeof option.calculated_price?.calculated_amount === "number") {
    return option.calculated_price.calculated_amount
  }
  const price = option.prices?.find(
    (candidate: any) =>
      !currencyCode || candidate.currency_code === currencyCode
  )
  return typeof price?.amount === "number" ? price.amount : 0
}

function getPickupUnavailableReason(location: any) {
  if (!location) return SHIPPING_AVAILABILITY_ERROR_CODES.PICKUP_LOCATION_REQUIRED
  if (!location.is_enabled) {
    return SHIPPING_AVAILABILITY_ERROR_CODES.PICKUP_LOCATION_DISABLED
  }
  return null
}

function getPickupUnavailableMessage(reason: string | null) {
  switch (reason) {
    case SHIPPING_AVAILABILITY_ERROR_CODES.PICKUP_LOCATION_DISABLED:
      return "The pickup location for this shipping option is disabled."
    default:
      return "The pickup shipping option has no pickup location."
  }
}

function normalizeGeoZoneValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function deriveAddressFromGeoZone(
  geoZone: any
): ShippingOptionServiceZoneAddress | null {
  const type = normalizeGeoZoneValue(geoZone?.type).toLowerCase()
  const countryCode = normalizeGeoZoneValue(geoZone?.country_code).toLowerCase()
  const province = normalizeGeoZoneValue(geoZone?.province_code) || null
  const city = normalizeGeoZoneValue(geoZone?.city) || null
  const postalCode = normalizeGeoZoneValue(geoZone?.postal_expression) || null

  if (!/^[a-z]{2}$/.test(countryCode)) return null
  if (type === "province" && !province) return null
  if (type === "city" && (!province || !city)) return null
  if (type === "zip" && (!province || !city || !postalCode)) return null
  if (!["country", "province", "city", "zip"].includes(type)) return null

  return {
    country_code: countryCode,
    province,
    city,
    postal_code: postalCode,
  }
}

export async function deriveShippingOptionServiceZoneAddress(
  container: MedusaContainer,
  shippingOptionId: string
): Promise<ShippingOptionServiceZoneAddress> {
  const fulfillment = container.resolve(Modules.FULFILLMENT) as any
  const [option] = await fulfillment.listShippingOptions({
    id: [shippingOptionId],
  })
  if (!option) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.OPTION_NOT_FOUND,
      "Shipping option not found.",
      { shipping_option_id: shippingOptionId }
    )
  }

  const serviceZoneId = option.service_zone_id
  const serviceZone = serviceZoneId
    ? await fulfillment.retrieveServiceZone(serviceZoneId, {
        relations: ["geo_zones"],
      })
    : null
  const typeRank: Record<string, number> = {
    zip: 0,
    city: 1,
    province: 2,
    country: 3,
  }
  const geoZones = [...(serviceZone?.geo_zones ?? [])].sort((left, right) => {
    const leftType = normalizeGeoZoneValue(left?.type).toLowerCase()
    const rightType = normalizeGeoZoneValue(right?.type).toLowerCase()
    const rankDiff = (typeRank[leftType] ?? 99) - (typeRank[rightType] ?? 99)
    if (rankDiff !== 0) return rankDiff
    return [left?.country_code, left?.province_code, left?.city, left?.id]
      .map(normalizeGeoZoneValue)
      .join("|")
      .localeCompare(
        [right?.country_code, right?.province_code, right?.city, right?.id]
          .map(normalizeGeoZoneValue)
          .join("|")
      )
  })
  const address = geoZones
    .map(deriveAddressFromGeoZone)
    .find((candidate): candidate is ShippingOptionServiceZoneAddress => !!candidate)

  if (!address) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.SHIPPING_OPTION_SERVICE_ZONE_INVALID,
      "This shipping option's service zone cannot provide a valid checkout address.",
      {
        shipping_option_id: shippingOptionId,
        service_zone_id: serviceZoneId ?? null,
      }
    )
  }

  return address
}

function toPickupLocationSnapshot(location: any): PickupLocationSnapshot {
  return {
    id: location.id,
    name: location.name,
    address: location.address,
    country_code:
      typeof location.country_code === "string"
        ? location.country_code.toLowerCase()
        : null,
    city: location.city ?? null,
    province: location.province ?? null,
    postal_code: location.postal_code ?? null,
    phone: location.phone ?? null,
    hours: location.hours ?? null,
    note: location.note ?? null,
  }
}

async function getCart(container: MedusaContainer, cartId: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "email",
      "metadata",
      "currency_code",
      "items.id",
      "items.title",
      "items.product_id",
      "items.product_title",
      "items.thumbnail",
      "items.quantity",
      "items.variant.product.id",
      "items.variant.product.title",
      "shipping_methods.id",
      "shipping_methods.name",
      "shipping_methods.shipping_option_id",
      "shipping_methods.metadata",
      "shipping_address.id",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.phone",
      "shipping_address.address_1",
      "shipping_address.city",
      "shipping_address.province",
      "shipping_address.postal_code",
      "shipping_address.country_code",
    ],
    filters: { id: cartId },
  })

  const cart = data?.[0]
  if (!cart) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Cart with id '${cartId}' not found`)
  }
  return cart as any
}

async function getPickupLocationsByOption(
  container: MedusaContainer,
  optionIds: string[]
) {
  const shippingAvailability = container.resolve(
    SHIPPING_AVAILABILITY_MODULE
  ) as ShippingAvailabilityModuleService
  const pickupLocations = container.resolve(
    PICKUP_LOCATION_MODULE
  ) as PickupLocationModuleService

  if (optionIds.length === 0) return new Map<string, any>()

  const bindings = await shippingAvailability.listShippingOptionPickupLocations({
    shipping_option_id: optionIds,
  } as any)
  const locationIds = normalizeShippingOptionIds(
    bindings.map((binding: any) => binding.pickup_location_id)
  )
  const locations = locationIds.length
    ? await pickupLocations.listPickupLocations({ id: locationIds } as any)
    : []
  const locationById = new Map(locations.map((location: any) => [location.id, location]))

  return new Map(
    bindings.map((binding: any) => [
      binding.shipping_option_id,
      locationById.get(binding.pickup_location_id) ?? null,
    ])
  )
}

export async function getCartShippingAvailability(
  container: MedusaContainer,
  cartId: string
): Promise<CartShippingAvailability> {
  const shippingAvailability = container.resolve(
    SHIPPING_AVAILABILITY_MODULE
  ) as ShippingAvailabilityModuleService
  const cart = await getCart(container, cartId)
  const items = cart.items ?? []
  const productIds = normalizeShippingOptionIds(
    items
      .map((item: any) => item.product_id || item.variant?.product?.id)
      .filter(Boolean)
  )
  const productOptionLinks = productIds.length
    ? await shippingAvailability.listProductShippingOptions({
        product_id: productIds,
      } as any)
    : []
  const allowedOptionsByProduct = new Map<string, Set<string>>()

  for (const link of productOptionLinks as any[]) {
    const allowed = allowedOptionsByProduct.get(link.product_id) ?? new Set<string>()
    allowed.add(link.shipping_option_id)
    allowedOptionsByProduct.set(link.product_id, allowed)
  }

  const { result: coreOptions } = await listShippingOptionsForCartWorkflow(
    container
  ).run({
    input: {
      cart_id: cartId,
      fields: ["metadata"],
    },
  })
  const coreOptionIds = new Set(
    (coreOptions as any[]).map((option) => option.id)
  )
  const candidateOptionIds = normalizeShippingOptionIds(
    (productOptionLinks as any[])
      .map((link) => link.shipping_option_id)
      .filter((id) => !coreOptionIds.has(id))
  )
  const fulfillment = container.resolve(Modules.FULFILLMENT) as any
  const pickupCandidates = candidateOptionIds.length
    ? (
        await fulfillment.listShippingOptions(
          { id: candidateOptionIds },
          { take: candidateOptionIds.length }
        )
      ).filter(isPickupOption)
    : []
  const allOptions = [...(coreOptions as any[]), ...pickupCandidates]
  const optionIds = allOptions.map((option) => option.id)
  const pickupLocationByOption = await getPickupLocationsByOption(
    container,
    optionIds
  )
  const shippingOptions = allOptions.map((option) => {
    const pickup = isPickupOption(option)
    const coreAvailable = coreOptionIds.has(option.id)
    const pickupLocation = pickupLocationByOption.get(option.id) ?? null
    const pickupLocationValid =
      !pickup ||
      Boolean(pickupLocation?.is_enabled)
    const incompatibleItems = getIncompatibleCartItems(
      items,
      allowedOptionsByProduct,
      option.id
    )
    const unavailableReason = pickup
      ? getPickupUnavailableReason(pickupLocation)
      : null

    return {
      id: option.id,
      name: option.name,
      amount: getOptionAmount(option, cart.currency_code),
      price_type: option.price_type,
      provider_id: option.provider_id,
      metadata: option.metadata ?? null,
      is_pickup: pickup,
      core_available: coreAvailable,
      is_compatible: incompatibleItems.length === 0 && pickupLocationValid,
      pickup_location_valid: pickupLocationValid,
      pickup_location: pickupLocation
        ? toPickupLocationSnapshot(pickupLocation)
        : null,
      incompatible_items: incompatibleItems,
      unavailable_reason: unavailableReason,
    } satisfies ShippingOptionCompatibility
  })

  return {
    cart_id: cartId,
    item_count: items.reduce(
      (total: number, item: any) => total + Number(item.quantity || 0),
      0
    ),
    shipping_options: shippingOptions,
    selected_shipping_option_id:
      cart.shipping_methods?.[0]?.shipping_option_id ?? null,
    cart,
  }
}

export async function preflightCartShippingOption(
  container: MedusaContainer,
  cartId: string,
  shippingOptionId: string
) {
  if (!shippingOptionId) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.OPTION_REQUIRED,
      "A shipping option is required."
    )
  }

  const availability = await getCartShippingAvailability(container, cartId)
  if (availability.item_count === 0) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.EMPTY_CART,
      "The cart is empty."
    )
  }

  const option = availability.shipping_options.find(
    (candidate) => candidate.id === shippingOptionId
  )
  if (!option) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.OPTION_UNAVAILABLE,
      "The selected shipping option is not available for this cart.",
      { shipping_option_id: shippingOptionId }
    )
  }
  if (!option.pickup_location_valid) {
    throw createShippingAvailabilityError(
      option.unavailable_reason ||
        SHIPPING_AVAILABILITY_ERROR_CODES.PICKUP_LOCATION_REQUIRED,
      getPickupUnavailableMessage(option.unavailable_reason),
      { shipping_option_id: shippingOptionId }
    )
  }
  if (option.is_pickup) {
    assertValidPickupContact(availability.cart, shippingOptionId)
  }
  if (option.incompatible_items.length > 0) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.OPTION_INCOMPATIBLE,
      "Some cart items do not support the selected shipping option.",
      {
        shipping_option_id: shippingOptionId,
        incompatible_items: option.incompatible_items,
      },
      MedusaError.Types.CONFLICT
    )
  }

  if (!option.is_pickup) {
    if (!option.core_available) {
      throw createShippingAvailabilityError(
        SHIPPING_AVAILABILITY_ERROR_CODES.OPTION_UNAVAILABLE,
        "The selected shipping option is not available for the cart address.",
        { shipping_option_id: shippingOptionId }
      )
    }
    if (!hasValidDeliveryAddress(availability.cart.shipping_address)) {
      throw createShippingAvailabilityError(
        SHIPPING_AVAILABILITY_ERROR_CODES.SHIPPING_ADDRESS_INVALID,
        "A valid shipping address is required for delivery.",
        { shipping_option_id: shippingOptionId }
      )
    }

    return { availability, option, shipping_address: null }
  }

  const serviceZoneAddress = await deriveShippingOptionServiceZoneAddress(
    container,
    shippingOptionId
  )
  const currentAddress = availability.cart.shipping_address
  if (!currentAddress?.id) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.PICKUP_CONTACT_INVALID,
      "A cart shipping address is required for pickup contact details.",
      { shipping_option_id: shippingOptionId }
    )
  }

  return {
    availability,
    option,
    shipping_address: {
      id: currentAddress.id,
      first_name: currentAddress.first_name,
      last_name: currentAddress.last_name,
      phone: currentAddress.phone,
      address_1: "Pickup Order",
      address_2: null,
      city: serviceZoneAddress.city,
      province: serviceZoneAddress.province,
      postal_code: serviceZoneAddress.postal_code,
      country_code: serviceZoneAddress.country_code,
    },
  }
}

export async function assertCartSupportsShippingOption(
  container: MedusaContainer,
  cartId: string,
  shippingOptionId: string
) {
  const result = await preflightCartShippingOption(
    container,
    cartId,
    shippingOptionId
  )
  if (!result.option.core_available) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.OPTION_UNAVAILABLE,
      "The selected shipping option is not available for the cart address.",
      { shipping_option_id: shippingOptionId }
    )
  }

  return result
}

export function hasValidDeliveryAddress(address: any) {
  return Boolean(
    address?.first_name?.trim?.() &&
      address?.last_name?.trim?.() &&
      address?.address_1?.trim?.() &&
      address?.city?.trim?.() &&
      address?.country_code?.trim?.()
  )
}

export type PickupContactValidation = {
  missing_fields: string[]
  invalid_fields: string[]
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validatePickupContact(cart: any): PickupContactValidation {
  const address = cart?.shipping_address ?? {}
  const requiredFields = [
    ["shipping_address.first_name", address.first_name],
    ["shipping_address.last_name", address.last_name],
    ["shipping_address.phone", address.phone],
    ["email", cart?.email],
  ] as const
  const missingFields = requiredFields
    .filter(([, value]) => typeof value !== "string" || !value.trim())
    .map(([field]) => field)
  const email = typeof cart?.email === "string" ? cart.email.trim() : ""

  return {
    missing_fields: missingFields,
    invalid_fields:
      email && !EMAIL_PATTERN.test(email) ? ["email"] : [],
  }
}

export function assertValidPickupContact(
  cart: any,
  shippingOptionId?: string
) {
  const validation = validatePickupContact(cart)
  if (
    validation.missing_fields.length === 0 &&
    validation.invalid_fields.length === 0
  ) {
    return
  }

  throw createShippingAvailabilityError(
    SHIPPING_AVAILABILITY_ERROR_CODES.PICKUP_CONTACT_INVALID,
    "A first name, last name, phone number, and valid email are required for pickup.",
    {
      shipping_option_id: shippingOptionId ?? null,
      ...validation,
    }
  )
}

export async function validateShippingOptionIds(
  container: MedusaContainer,
  optionIds: string[]
) {
  const ids = normalizeShippingOptionIds(optionIds)
  if (ids.length === 0) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.OPTION_REQUIRED,
      "At least one shipping option is required."
    )
  }

  const fulfillment = container.resolve(Modules.FULFILLMENT) as any
  const options = await fulfillment.listShippingOptions({ id: ids })
  const found = new Set(options.map((option: any) => option.id))
  const missing = ids.filter((id) => !found.has(id))
  if (missing.length > 0) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.OPTION_NOT_FOUND,
      "One or more shipping options do not exist.",
      { shipping_option_ids: missing }
    )
  }

  return { ids, options }
}

export async function syncProductShippingOptions(
  container: MedusaContainer,
  productId: string,
  optionIds: string[]
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { id: productId },
  })
  if (!products?.[0]) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id '${productId}' not found`
    )
  }

  const { ids } = await validateShippingOptionIds(container, optionIds)
  const service = container.resolve(
    SHIPPING_AVAILABILITY_MODULE
  ) as ShippingAvailabilityModuleService
  return service.replaceProductShippingOptions(productId, ids)
}

export async function getProductShippingOptions(
  container: MedusaContainer,
  productId: string
) {
  const service = container.resolve(
    SHIPPING_AVAILABILITY_MODULE
  ) as ShippingAvailabilityModuleService
  const fulfillment = container.resolve(Modules.FULFILLMENT) as any
  const links = await service.listProductShippingOptions({ product_id: productId })
  const optionIds = links.map((link: any) => link.shipping_option_id)
  const options = optionIds.length
    ? await fulfillment.listShippingOptions({ id: optionIds })
    : []
  const optionById = new Map(options.map((option: any) => [option.id, option]))

  return {
    shipping_option_ids: optionIds,
    shipping_options: optionIds
      .map((id: string) => optionById.get(id))
      .filter(Boolean),
  }
}

export async function getShippingOptionPickupLocation(
  container: MedusaContainer,
  shippingOptionId: string
) {
  const service = container.resolve(
    SHIPPING_AVAILABILITY_MODULE
  ) as ShippingAvailabilityModuleService
  const pickupLocations = container.resolve(
    PICKUP_LOCATION_MODULE
  ) as PickupLocationModuleService
  const [binding] = await service.listShippingOptionPickupLocations({
    shipping_option_id: shippingOptionId,
  })
  if (!binding) {
    return { pickup_location_id: null, pickup_location: null }
  }

  const [location] = await pickupLocations.listPickupLocations({
    id: [binding.pickup_location_id],
  } as any)
  return {
    pickup_location_id: binding.pickup_location_id,
    pickup_location: location ?? null,
  }
}

export async function validateShippingOptionPickupLocationTarget(
  container: MedusaContainer,
  shippingOptionId: string,
  pickupLocationId: string | null | undefined,
  targetIsPickup: boolean
) {
  if (!targetIsPickup) {
    return { pickup_location_id: null, pickup_location: null }
  }
  if (!pickupLocationId) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.PICKUP_LOCATION_REQUIRED,
      "A pickup location is required for pickup shipping options.",
      { shipping_option_id: shippingOptionId }
    )
  }

  const service = container.resolve(
    SHIPPING_AVAILABILITY_MODULE
  ) as ShippingAvailabilityModuleService
  const pickupLocations = container.resolve(
    PICKUP_LOCATION_MODULE
  ) as PickupLocationModuleService
  const [location] = await pickupLocations.listPickupLocations({
    id: [pickupLocationId],
  } as any)
  if (!location) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.PICKUP_LOCATION_NOT_FOUND,
      "Pickup location not found.",
      { pickup_location_id: pickupLocationId }
    )
  }
  if (!location.is_enabled) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.PICKUP_LOCATION_DISABLED,
      "Only enabled pickup locations can be assigned.",
      { pickup_location_id: pickupLocationId }
    )
  }
  const [otherBinding] = await service.listShippingOptionPickupLocations({
    pickup_location_id: pickupLocationId,
  })
  if (otherBinding && otherBinding.shipping_option_id !== shippingOptionId) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.PICKUP_LOCATION_ALREADY_BOUND,
      "This pickup location is already assigned to another shipping option.",
      {
        pickup_location_id: pickupLocationId,
        shipping_option_id: otherBinding.shipping_option_id,
      },
      MedusaError.Types.CONFLICT
    )
  }

  return {
    pickup_location_id: pickupLocationId,
    pickup_location: location,
  }
}

export async function restoreShippingOptionPickupLocation(
  container: MedusaContainer,
  shippingOptionId: string,
  pickupLocationId: string | null
) {
  const service = container.resolve(
    SHIPPING_AVAILABILITY_MODULE
  ) as ShippingAvailabilityModuleService
  const [current] = await service.listShippingOptionPickupLocations({
    shipping_option_id: shippingOptionId,
  })

  if (!pickupLocationId) {
    if (current) await service.deleteShippingOptionPickupLocations(current.id)
    return
  }
  if (current) {
    if (current.pickup_location_id !== pickupLocationId) {
      await service.updateShippingOptionPickupLocations({
        id: current.id,
        pickup_location_id: pickupLocationId,
      })
    }
    return
  }

  await service.createShippingOptionPickupLocations({
    shipping_option_id: shippingOptionId,
    pickup_location_id: pickupLocationId,
  })
}

export async function syncShippingOptionPickupLocation(
  container: MedusaContainer,
  shippingOptionId: string,
  pickupLocationId: string | null | undefined
) {
  const fulfillment = container.resolve(Modules.FULFILLMENT) as any
  const service = container.resolve(
    SHIPPING_AVAILABILITY_MODULE
  ) as ShippingAvailabilityModuleService
  const [option] = await fulfillment.listShippingOptions({ id: [shippingOptionId] })
  if (!option) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.OPTION_NOT_FOUND,
      "Shipping option not found.",
      { shipping_option_id: shippingOptionId }
    )
  }

  const [current] = await service.listShippingOptionPickupLocations({
    shipping_option_id: shippingOptionId,
  })
  const targetIsPickup = isPickupOption(option)
  if (!targetIsPickup) {
    if (current) await service.deleteShippingOptionPickupLocations(current.id)
    return { pickup_location_id: null, pickup_location: null }
  }
  const validated = await validateShippingOptionPickupLocationTarget(
    container,
    shippingOptionId,
    pickupLocationId,
    targetIsPickup
  )
  const validatedPickupLocationId = validated.pickup_location_id as string

  if (current) {
    if (current.pickup_location_id !== validatedPickupLocationId) {
      await service.updateShippingOptionPickupLocations({
        id: current.id,
        pickup_location_id: validatedPickupLocationId,
      })
    }
  } else {
    await service.createShippingOptionPickupLocations({
      shipping_option_id: shippingOptionId,
      pickup_location_id: validatedPickupLocationId,
    })
  }

  return {
    pickup_location_id: validatedPickupLocationId,
    pickup_location: validated.pickup_location,
  }
}

export async function prepareCartShippingSnapshot(
  container: MedusaContainer,
  cartId: string
) {
  const cart = await getCart(container, cartId)
  const shippingMethod = cart.shipping_methods?.[0]
  const shippingOptionId = shippingMethod?.shipping_option_id
  if (!shippingOptionId) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.OPTION_REQUIRED,
      "A shipping option must be selected before checkout."
    )
  }

  await prepareCartAddressForShippingOption(
    container,
    cartId,
    shippingOptionId
  )
  const preparedCart = await getCart(container, cartId)

  const { option } = await assertCartSupportsShippingOption(
    container,
    cartId,
    shippingOptionId
  )
  const snapshot = buildShippingDeliverySnapshot(option)
  const cartService = container.resolve(Modules.CART) as any
  await cartService.updateCarts(cartId, {
    metadata: {
      ...(preparedCart.metadata ?? {}),
      [SHIPPING_DELIVERY_SNAPSHOT_KEY]: snapshot,
    },
  })
  await cartService.updateShippingMethods([
    {
      id: shippingMethod.id,
      metadata: {
        ...(shippingMethod.metadata ?? {}),
        type: snapshot.shipping_option.type,
        [SHIPPING_DELIVERY_SNAPSHOT_KEY]: snapshot,
      },
    },
  ])

  return snapshot
}

export async function prepareCartAddressForShippingOption(
  container: MedusaContainer,
  cartId: string,
  shippingOptionId: string
) {
  const preflight = await preflightCartShippingOption(
    container,
    cartId,
    shippingOptionId
  )
  if (!preflight.shipping_address) return null

  const cartService = container.resolve(Modules.CART) as any
  await cartService.updateCarts(cartId, {
    shipping_address: preflight.shipping_address,
  })

  return preflight.shipping_address
}

export function buildShippingDeliverySnapshot(
  option: ShippingOptionCompatibility,
  capturedAt = new Date().toISOString()
): ShippingDeliverySnapshot {
  return {
    version: 1,
    captured_at: capturedAt,
    shipping_option: {
      id: option.id,
      name: option.name,
      type: option.is_pickup ? "pickup" : "delivery",
    },
    pickup_location: option.pickup_location,
  }
}

export async function assertCartShippingSnapshot(
  container: MedusaContainer,
  cartId: string
) {
  const cart = await getCart(container, cartId)
  const shippingOptionId = cart.shipping_methods?.[0]?.shipping_option_id
  const snapshot = cart.metadata?.[
    SHIPPING_DELIVERY_SNAPSHOT_KEY
  ] as ShippingDeliverySnapshot | undefined

  if (!shippingOptionId || snapshot?.shipping_option?.id !== shippingOptionId) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.SNAPSHOT_REQUIRED,
      "The shipping selection must be prepared again before checkout.",
      { shipping_option_id: shippingOptionId ?? null }
    )
  }

  return snapshot
}

export async function assertShippingOptionCanBeDeleted(
  container: MedusaContainer,
  shippingOptionId: string
) {
  const service = container.resolve(
    SHIPPING_AVAILABILITY_MODULE
  ) as ShippingAvailabilityModuleService
  const productLinks = await service.listProductShippingOptions({
    shipping_option_id: shippingOptionId,
  })
  if (productLinks.length > 0) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.SHIPPING_OPTION_IN_USE,
      "This shipping option is still assigned to products.",
      { product_count: new Set(productLinks.map((link: any) => link.product_id)).size },
      MedusaError.Types.CONFLICT
    )
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  let skip = 0
  const take = 200
  while (true) {
    const { data, metadata } = await query.graph({
      entity: "order",
      fields: ["id", "status", "shipping_methods.shipping_option_id"],
      pagination: { skip, take },
    })
    const unfinished = (data ?? []).find((order: any) => {
      const finalStatus = ["completed", "canceled", "archived"].includes(
        String(order.status)
      )
      return (
        !finalStatus &&
        order.shipping_methods?.some(
          (method: any) => method.shipping_option_id === shippingOptionId
        )
      )
    })
    if (unfinished) {
      throw createShippingAvailabilityError(
        SHIPPING_AVAILABILITY_ERROR_CODES.SHIPPING_OPTION_IN_USE,
        "This shipping option is used by an unfinished order.",
        { order_id: unfinished.id },
        MedusaError.Types.CONFLICT
      )
    }
    skip += data?.length ?? 0
    if (!data?.length || skip >= (metadata?.count ?? skip)) break
  }
}

export async function deleteShippingOptionPickupBinding(
  container: MedusaContainer,
  shippingOptionId: string
) {
  const service = container.resolve(
    SHIPPING_AVAILABILITY_MODULE
  ) as ShippingAvailabilityModuleService
  const bindings = await service.listShippingOptionPickupLocations({
    shipping_option_id: shippingOptionId,
  })
  if (bindings.length > 0) {
    await service.deleteShippingOptionPickupLocations(
      bindings.map((binding: any) => binding.id)
    )
  }
  return bindings
}

export async function assertPickupLocationCanBeDeleted(
  container: MedusaContainer,
  pickupLocationId: string
) {
  const service = container.resolve(
    SHIPPING_AVAILABILITY_MODULE
  ) as ShippingAvailabilityModuleService
  const bindings = await service.listShippingOptionPickupLocations({
    pickup_location_id: pickupLocationId,
  })
  if (bindings.length > 0) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.PICKUP_LOCATION_IN_USE,
      "This pickup location is still assigned to a shipping option.",
      { shipping_option_id: bindings[0].shipping_option_id },
      MedusaError.Types.CONFLICT
    )
  }
}
