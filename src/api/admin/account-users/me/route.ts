import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { requireUserById } from "../helpers"

export const AUTHENTICATE = false

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const currentUserId = req.auth_context.actor_id

  if (!currentUserId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Unauthorized"
    )
  }

  const user = await requireUserById(req, currentUserId)
  res.json({ user })
}
