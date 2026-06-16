import { z } from "zod"

export const PostAdminCreatePickupLocation = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().optional().nullable(),
  hours: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  sort_order: z.number().int().optional(),
  is_enabled: z.boolean().optional(),
})

export const PostAdminUpdatePickupLocation = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  hours: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  sort_order: z.number().int().optional(),
  is_enabled: z.boolean().optional(),
})

export type PostAdminCreatePickupLocationType = z.infer<typeof PostAdminCreatePickupLocation>
export type PostAdminUpdatePickupLocationType = z.infer<typeof PostAdminUpdatePickupLocation>
