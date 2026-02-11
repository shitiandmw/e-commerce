import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { updatePopupWorkflow } from "../../../../workflows/popup/update-popup"
import { deletePopupWorkflow } from "../../../../workflows/popup/delete-popup"
import { PostAdminUpdatePopupType } from "../validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const { id } = req.params

  const { data: [popup] } = await query.graph({
    entity: "popup",
    fields: ["*"],
    filters: { id },
  })

  if (!popup) {
    res.status(404).json({ message: "Popup not found" })
    return
  }

  res.json({ popup })
}

export const POST = async (
  req: MedusaRequest<PostAdminUpdatePopupType>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await updatePopupWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody,
    },
  })

  res.json({ popup: result })
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await deletePopupWorkflow(req.scope).run({
    input: { id },
  })

  res.json({ id, object: "popup", deleted: true })
}
