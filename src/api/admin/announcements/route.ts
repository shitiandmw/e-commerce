import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createAnnouncementWorkflow } from "../../../workflows/announcement/create-announcement"
import { PostAdminCreateAnnouncementType } from "./validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")

  const { data: announcements, metadata } = await query.graph({
    entity: "announcement",
    ...req.queryConfig,
  })

  res.json({
    announcements,
    count: metadata?.count || announcements.length,
    offset: metadata?.skip || 0,
    limit: metadata?.take || announcements.length,
  })
}

export const POST = async (
  req: MedusaRequest<PostAdminCreateAnnouncementType>,
  res: MedusaResponse
) => {
  const { result } = await createAnnouncementWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.json({ announcement: result })
}
