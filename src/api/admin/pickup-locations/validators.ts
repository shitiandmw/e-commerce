import { z } from "zod"

export const PostAdminCreatePickupLocation = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().min(1),
  country_code: z.string().trim().length(2).transform((value) => value.toLowerCase()).optional().nullable(),
  city: z.string().trim().min(1).optional().nullable(),
  province: z.string().trim().optional().nullable(),
  postal_code: z.string().trim().min(1).optional().nullable(),
  phone: z.string().optional().nullable(),
  hours: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  sort_order: z.number().int().optional(),
  is_enabled: z.boolean().optional(),
})

export const PostAdminUpdatePickupLocation = z.object({
  name: z.string().trim().min(1).optional(),
  address: z.string().trim().min(1).optional(),
  country_code: z.string().trim().length(2).transform((value) => value.toLowerCase()).optional().nullable(),
  city: z.string().trim().min(1).optional().nullable(),
  province: z.string().trim().optional().nullable(),
  postal_code: z.string().trim().min(1).optional().nullable(),
  phone: z.string().optional().nullable(),
  hours: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  sort_order: z.number().int().optional(),
  is_enabled: z.boolean().optional(),
})

export type PostAdminCreatePickupLocationType = z.infer<typeof PostAdminCreatePickupLocation>
export type PostAdminUpdatePickupLocationType = z.infer<typeof PostAdminUpdatePickupLocation>
