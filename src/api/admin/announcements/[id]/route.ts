import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { updateAnnouncementWorkflow } from "../../../../workflows/announcement/update-announcement"
import { deleteAnnouncementWorkflow } from "../../../../workflows/announcement/delete-announcement"
import { PostAdminUpdateAnnouncementType } from "../validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const { id } = req.params

  const { data: [announcement] } = await query.graph({
    entity: "announcement",
    fields: ["*"],
    filters: { id },
  })

  if (!announcement) {
    res.status(404).json({ message: "Announcement not found" })
    return
  }

  res.json({ announcement })
}

export const POST = async (
  req: MedusaRequest<PostAdminUpdateAnnouncementType>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await updateAnnouncementWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody,
    },
  })

  res.json({ announcement: result })
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await deleteAnnouncementWorkflow(req.scope).run({
    input: { id },
  })

  res.json({ id, object: "announcement", deleted: true })
}
