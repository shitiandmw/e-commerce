import { updateUsersWorkflow } from "@medusajs/core-flows"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { requireUserById, safeUser } from "../helpers"
import { PostAdminUpdateAccountUserType } from "../validators"

export const AUTHENTICATE = false

export const POST = async (
  req: MedusaRequest<PostAdminUpdateAccountUserType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  await requireUserById(req, id)

  const { result } = await updateUsersWorkflow(req.scope).run({
    input: {
      updates: [
        {
          id,
          ...req.validatedBody,
        },
      ],
    },
  })

  res.json({ user: safeUser(result[0] as Record<string, any>) })
}
