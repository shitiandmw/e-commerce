import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  requireUserById,
  updateEmailpassPassword,
  verifyEmailpassPassword,
} from "../../helpers"
import { PostAdminChangeOwnPasswordType } from "../../validators"

export const AUTHENTICATE = false

export const POST = async (
  req: AuthenticatedMedusaRequest<PostAdminChangeOwnPasswordType>,
  res: MedusaResponse
) => {
  const currentUserId = req.auth_context.actor_id

  if (!currentUserId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Unauthorized"
    )
  }

  const user = await requireUserById(req, currentUserId)
  await verifyEmailpassPassword(req, user.email, req.validatedBody.current_password)
  await updateEmailpassPassword(req, user.email, req.validatedBody.password)

  res.json({ success: true })
}
