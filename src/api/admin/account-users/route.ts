import { createUserAccountWorkflow } from "@medusajs/core-flows"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  getUserByEmail,
  normalizeEmail,
  registerEmailpassIdentity,
  safeUser,
} from "./helpers"
import { PostAdminCreateAccountUserType } from "./validators"

export const AUTHENTICATE = false

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const parsedLimit = Number(req.query.limit || 50)
  const parsedOffset = Number(req.query.offset || 0)
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 50
  const offset = Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0
  const q = typeof req.query.q === "string" ? req.query.q.trim() : ""

  const filters: Record<string, any> = {}
  if (q) {
    filters.email = { $ilike: `%${q}%` }
  }

  const { data: users, metadata } = await query.graph({
    entity: "user",
    fields: [
      "id",
      "email",
      "first_name",
      "last_name",
      "avatar_url",
      "metadata",
      "created_at",
      "updated_at",
    ],
    filters,
    pagination: {
      skip: offset,
      take: limit,
      order: { created_at: "DESC" },
    },
  })

  res.json({
    users: users.map(safeUser),
    count: metadata?.count || users.length,
    offset: metadata?.skip || offset,
    limit: metadata?.take || limit,
  })
}

export const POST = async (
  req: MedusaRequest<PostAdminCreateAccountUserType>,
  res: MedusaResponse
) => {
  const body = req.validatedBody
  const email = normalizeEmail(body.email)
  const existingUser = await getUserByEmail(req, email)

  if (existingUser) {
    throw new MedusaError(
      MedusaError.Types.DUPLICATE_ERROR,
      "A user with this email already exists"
    )
  }

  const authIdentityId = await registerEmailpassIdentity(req, email, body.password)
  const { result } = await createUserAccountWorkflow(req.scope).run({
    input: {
      authIdentityId,
      userData: {
        email,
        first_name: body.first_name,
        last_name: body.last_name,
        avatar_url: body.avatar_url,
        metadata: body.metadata,
      },
    },
  })

  res.status(201).json({ user: safeUser(result as Record<string, any>) })
}
