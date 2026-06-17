import { z } from "zod"

const nameField = z
  .string()
  .trim()
  .max(255)
  .nullable()
  .optional()

const avatarUrlField = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().trim().url().nullable().optional()
)

export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .refine((value) => value === value.trim(), "Password cannot start or end with spaces")
  .refine((value) => /[a-z]/.test(value), "Password must include a lowercase letter")
  .refine((value) => /[A-Z]/.test(value), "Password must include an uppercase letter")
  .refine((value) => /\d/.test(value), "Password must include a number")

const confirmedPasswordFields = z.object({
  password: passwordSchema,
  confirm_password: z.string(),
})

const confirmedPasswordSchema = confirmedPasswordFields
  .refine((value) => value.password === value.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })

export const PostAdminCreateAccountUser = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    first_name: nameField,
    last_name: nameField,
    avatar_url: avatarUrlField,
    metadata: z.record(z.unknown()).optional(),
    password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((value) => value.password === value.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })

export const PostAdminUpdateAccountUser = z.object({
  first_name: nameField,
  last_name: nameField,
  avatar_url: avatarUrlField,
  metadata: z.record(z.unknown()).nullable().optional(),
})

export const PostAdminResetAccountUserPassword = confirmedPasswordSchema

export const PostAdminChangeOwnPassword = confirmedPasswordFields
  .extend({
    current_password: z.string().min(1, "Current password is required"),
  })
  .refine((value) => value.password === value.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })
  .refine((value) => value.current_password !== value.password, {
    message: "New password must be different from the current password",
    path: ["password"],
  })

export type PostAdminCreateAccountUserType = z.infer<typeof PostAdminCreateAccountUser>
export type PostAdminUpdateAccountUserType = z.infer<typeof PostAdminUpdateAccountUser>
export type PostAdminResetAccountUserPasswordType = z.infer<typeof PostAdminResetAccountUserPassword>
export type PostAdminChangeOwnPasswordType = z.infer<typeof PostAdminChangeOwnPassword>
