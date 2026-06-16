import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PICKUP_LOCATION_MODULE } from "../../../modules/pickup-location"
import PickupLocationModuleService from "../../../modules/pickup-location/service"
import { PostAdminCreatePickupLocationType } from "./validators"

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

  res.json({
    pickup_locations: pickupLocations,
    count: metadata?.count || pickupLocations.length,
    offset: metadata?.skip || 0,
    limit: metadata?.take || pickupLocations.length,
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
