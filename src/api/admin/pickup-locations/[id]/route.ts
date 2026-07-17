import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PostAdminUpdatePickupLocationType } from "../validators"
import {
  deletePickupLocationWorkflow,
  updatePickupLocationWorkflow,
} from "../../../../workflows/pickup-location/mutate-pickup-location"

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
  const { id } = req.params
  const { result: pickupLocation } = await updatePickupLocationWorkflow(
    req.scope
  ).run({
    input: { id, update: req.validatedBody },
  })

  res.json({ pickup_location: pickupLocation })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const { result } = await deletePickupLocationWorkflow(req.scope).run({
    input: id,
  })
  res.json(result)
}
