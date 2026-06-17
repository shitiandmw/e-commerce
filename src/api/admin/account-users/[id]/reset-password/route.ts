import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { requireUserById, updateEmailpassPassword } from "../../helpers"
import { PostAdminResetAccountUserPasswordType } from "../../validators"

export const AUTHENTICATE = false

export const POST = async (
  req: AuthenticatedMedusaRequest<PostAdminResetAccountUserPasswordType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const currentUserId = req.auth_context.actor_id

  if (currentUserId === id) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Use change password to update your own password"
    )
  }

  const user = await requireUserById(req, id)
  await updateEmailpassPassword(req, user.email, req.validatedBody.password)

  res.json({ success: true })
}
