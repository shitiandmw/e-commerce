import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MENU_MODULE } from "../../../../../modules/menu"
import MenuModuleService from "../../../../../modules/menu/service"
import { createMenuItemWorkflow } from "../../../../../workflows/menu/create-menu-item"
import { PostAdminCreateMenuItemType } from "../../../menu-items/validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id: menu_id } = req.params
  const menuService: MenuModuleService = req.scope.resolve(MENU_MODULE)

  const items = await menuService.listMenuItems(
    { menu_id },
    { order: { sort_order: "ASC" } }
  )

  res.json({ items })
}

export const POST = async (
  req: MedusaRequest<PostAdminCreateMenuItemType>,
  res: MedusaResponse
) => {
  const { id: menu_id } = req.params

  const { result } = await createMenuItemWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      menu_id,
    },
  })

  res.json({ item: result })
}
