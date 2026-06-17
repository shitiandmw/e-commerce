import { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

const USER_FIELDS = [
  "id",
  "email",
  "first_name",
  "last_name",
  "avatar_url",
  "metadata",
  "created_at",
  "updated_at",
]

export type SafeAdminUser = {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function safeUser(user: Record<string, any>): SafeAdminUser {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name ?? null,
    last_name: user.last_name ?? null,
    avatar_url: user.avatar_url ?? null,
    metadata: user.metadata ?? null,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }
}

export async function getUserById(
  req: MedusaRequest,
  id: string
): Promise<SafeAdminUser | null> {
  const query = req.scope.resolve("query")

  const { data } = await query.graph({
    entity: "user",
    fields: USER_FIELDS,
    filters: { id },
  })

  const user = data?.[0]
  return user ? safeUser(user) : null
}

export async function getUserByEmail(
  req: MedusaRequest,
  email: string
): Promise<SafeAdminUser | null> {
  const query = req.scope.resolve("query")

  const { data } = await query.graph({
    entity: "user",
    fields: USER_FIELDS,
    filters: { email: normalizeEmail(email) },
  })

  const user = data?.[0]
  return user ? safeUser(user) : null
}

export async function requireUserById(
  req: MedusaRequest,
  id: string
): Promise<SafeAdminUser> {
  const user = await getUserById(req, id)

  if (!user) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `User with id ${id} was not found`
    )
  }

  return user
}

export async function registerEmailpassIdentity(
  req: MedusaRequest,
  email: string,
  password: string
): Promise<string> {
  const authService = req.scope.resolve(Modules.AUTH) as any
  const { authIdentity, success, error } = await authService.register("emailpass", {
    body: { email: normalizeEmail(email), password },
  })

  if (!success || !authIdentity?.id) {
    const isDuplicate =
      typeof error === "string" && error.toLowerCase().includes("already exists")

    throw new MedusaError(
      isDuplicate
        ? MedusaError.Types.DUPLICATE_ERROR
        : MedusaError.Types.INVALID_DATA,
      isDuplicate ? "A user with this email already exists" : error || "Unable to create login identity"
    )
  }

  return authIdentity.id
}

export async function updateEmailpassPassword(
  req: MedusaRequest,
  email: string,
  password: string
) {
  const authService = req.scope.resolve(Modules.AUTH) as any
  const { success, error } = await authService.updateProvider("emailpass", {
    entity_id: email,
    password,
  })

  if (!success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      error || "Unable to update password"
    )
  }
}

export async function verifyEmailpassPassword(
  req: MedusaRequest,
  email: string,
  password: string
) {
  const authService = req.scope.resolve(Modules.AUTH) as any
  const { success } = await authService.authenticate("emailpass", {
    body: { email, password },
  })

  if (!success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Current password is incorrect"
    )
  }
}
