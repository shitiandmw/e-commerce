import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createMenuWorkflow } from "../../../workflows/menu/create-menu"
import { PostAdminCreateMenuType } from "./validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")

  const { data: menus, metadata } = await query.graph({
    entity: "menu",
    ...req.queryConfig,
  })

  res.json({
    menus,
    count: metadata?.count || menus.length,
    offset: metadata?.skip || 0,
    limit: metadata?.take || menus.length,
  })
}

export const POST = async (
  req: MedusaRequest<PostAdminCreateMenuType>,
  res: MedusaResponse
) => {
  const { result } = await createMenuWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.json({ menu: result })
}
