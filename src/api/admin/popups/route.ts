import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createPopupWorkflow } from "../../../workflows/popup/create-popup"
import { PostAdminCreatePopupType } from "./validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")

  const { data: popups, metadata } = await query.graph({
    entity: "popup",
    ...req.queryConfig,
  })

  res.json({
    popups,
    count: metadata?.count || popups.length,
    offset: metadata?.skip || 0,
    limit: metadata?.take || popups.length,
  })
}

export const POST = async (
  req: MedusaRequest<PostAdminCreatePopupType>,
  res: MedusaResponse
) => {
  const { result } = await createPopupWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.json({ popup: result })
}
