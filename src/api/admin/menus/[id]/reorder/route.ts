import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { reorderMenuItemsWorkflow } from "../../../../../workflows/menu/reorder-menu-items"
import { PostAdminReorderMenuItemsType } from "../../../menu-items/validators"

export const POST = async (
  req: MedusaRequest<PostAdminReorderMenuItemsType>,
  res: MedusaResponse
) => {
  const { result } = await reorderMenuItemsWorkflow(req.scope).run({
    input: {
      items: req.validatedBody.items,
    },
  })

  res.json({ items: result })
}
