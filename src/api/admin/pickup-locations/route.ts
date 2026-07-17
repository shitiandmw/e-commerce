import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PICKUP_LOCATION_MODULE } from "../../../modules/pickup-location"
import PickupLocationModuleService from "../../../modules/pickup-location/service"
import { PostAdminCreatePickupLocationType } from "./validators"
import { SHIPPING_AVAILABILITY_MODULE } from "../../../modules/shipping-availability"
import type ShippingAvailabilityModuleService from "../../../modules/shipping-availability/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const queryConfig = req.queryConfig || {}
  const pagination = (queryConfig as any).pagination || {}
  const order = pagination.order || {}

  const { data: pickupLocations, metadata } = await query.graph({
    entity: "pickup_location",
    ...queryConfig,
    pagination: {
      ...pagination,
      order: {
        ...order,
        sort_order: order.sort_order || "ASC",
        created_at: order.created_at || "ASC",
        id: order.id || "ASC",
      },
    },
  })
  const availability = req.scope.resolve(
    SHIPPING_AVAILABILITY_MODULE
  ) as ShippingAvailabilityModuleService
  const pickupLocationIds = pickupLocations.map((location: any) => location.id)
  const bindings = pickupLocationIds.length
    ? await availability.listShippingOptionPickupLocations({
        pickup_location_id: pickupLocationIds,
      } as any)
    : []
  const shippingOptionIdByLocation = new Map(
    bindings.map((binding: any) => [
      binding.pickup_location_id,
      binding.shipping_option_id,
    ])
  )
  const locationsWithBindings = pickupLocations.map((location: any) => ({
    ...location,
    shipping_option_id: shippingOptionIdByLocation.get(location.id) ?? null,
  }))

  res.json({
    pickup_locations: locationsWithBindings,
    count: metadata?.count || locationsWithBindings.length,
    offset: metadata?.skip || 0,
    limit: metadata?.take || locationsWithBindings.length,
  })
}

export const POST = async (
  req: MedusaRequest<PostAdminCreatePickupLocationType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const svc: PickupLocationModuleService = req.scope.resolve(PICKUP_LOCATION_MODULE)
  const input = { ...req.validatedBody }

  if (typeof input.sort_order !== "number") {
    const { data: [lastPickupLocation] } = await query.graph({
      entity: "pickup_location",
      fields: ["id", "sort_order"],
      pagination: {
        take: 1,
        order: {
          sort_order: "DESC",
          created_at: "DESC",
          id: "DESC",
        },
      },
    })

    input.sort_order = ((lastPickupLocation as any)?.sort_order || 0) + 10
  }

  const pickupLocation = await svc.createPickupLocations(input)

  res.json({ pickup_location: pickupLocation })
}
