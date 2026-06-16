import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PICKUP_LOCATION_MODULE } from "../../../../modules/pickup-location"
import PickupLocationModuleService from "../../../../modules/pickup-location/service"
import { PostAdminUpdatePickupLocationType } from "../validators"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const { id } = req.params

  const { data: [pickupLocation] } = await query.graph({
    entity: "pickup_location",
    fields: ["*"],
    filters: { id },
  })

  if (!pickupLocation) {
    res.status(404).json({ message: "Pickup location not found" })
    return
  }

  res.json({ pickup_location: pickupLocation })
}

export const POST = async (
  req: MedusaRequest<PostAdminUpdatePickupLocationType>,
  res: MedusaResponse
) => {
  const svc: PickupLocationModuleService = req.scope.resolve(PICKUP_LOCATION_MODULE)
  const { id } = req.params
  const pickupLocation = await svc.updatePickupLocations({
    id,
    ...req.validatedBody,
  })

  res.json({ pickup_location: pickupLocation })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc: PickupLocationModuleService = req.scope.resolve(PICKUP_LOCATION_MODULE)
  const { id } = req.params

  await svc.deletePickupLocations(id)

  res.json({ id, object: "pickup_location", deleted: true })
}
