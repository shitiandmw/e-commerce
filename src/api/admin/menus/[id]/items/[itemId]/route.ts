import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { updateMenuItemWorkflow } from "../../../../../../workflows/menu/update-menu-item"
import { deleteMenuItemWorkflow } from "../../../../../../workflows/menu/delete-menu-item"
import { PostAdminUpdateMenuItemType } from "../../../../menu-items/validators"

export const POST = async (
  req: MedusaRequest<PostAdminUpdateMenuItemType>,
  res: MedusaResponse
) => {
  const { itemId } = req.params

  const { result } = await updateMenuItemWorkflow(req.scope).run({
    input: {
      id: itemId,
      ...req.validatedBody,
    },
  })

  res.json({ item: result })
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { itemId } = req.params

  await deleteMenuItemWorkflow(req.scope).run({
    input: { id: itemId },
  })

  res.json({ id: itemId, object: "menu_item", deleted: true })
}
