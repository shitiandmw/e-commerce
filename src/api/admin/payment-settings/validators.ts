import { z } from "zod"

export const PostAdminUpdatePaymentSettings = z.object({
  provider_id: z.string(),
  is_enabled: z.boolean().optional(),
  display_name: z.string().optional(),
  description: z.string().optional(),
  sandbox_mode: z.boolean().optional(),
  api_key: z.string().optional(),
  webhook_secret: z.string().optional(),
})

export type PostAdminUpdatePaymentSettingsType = z.infer<typeof PostAdminUpdatePaymentSettings>
