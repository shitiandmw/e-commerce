import { z } from "zod"

export const PostAdminCreateMenuItem = z.object({
  label: z.string().min(1),
  url: z.string().nullable().optional(),
  icon_url: z.string().nullable().optional(),
  sort_order: z.number().int().default(0),
  is_enabled: z.boolean().default(true),
  metadata: z.record(z.unknown()).nullable().optional(),
  parent_id: z.string().nullable().optional(),
})

export const PostAdminUpdateMenuItem = z.object({
  label: z.string().min(1).optional(),
  url: z.string().nullable().optional(),
  icon_url: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
  is_enabled: z.boolean().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
  parent_id: z.string().nullable().optional(),
})

export const PostAdminReorderMenuItems = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      sort_order: z.number().int(),
      parent_id: z.string().nullable().optional(),
    })
  ),
})

export type PostAdminCreateMenuItemType = z.infer<typeof PostAdminCreateMenuItem>
export type PostAdminUpdateMenuItemType = z.infer<typeof PostAdminUpdateMenuItem>
export type PostAdminReorderMenuItemsType = z.infer<typeof PostAdminReorderMenuItems>
