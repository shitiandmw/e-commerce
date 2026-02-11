import { z } from "zod"

export const PostAdminCreatePopup = z.object({
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  button_text: z.string().nullable().optional(),
  button_link: z.string().nullable().optional(),
  is_enabled: z.boolean().optional(),
  trigger_type: z.enum(["first_visit", "every_visit", "specific_page"]).optional(),
  display_frequency: z.enum(["once", "once_per_session", "once_per_day"]).optional(),
  target_page: z.string().nullable().optional(),
  sort_order: z.number().optional(),
})

export const PostAdminUpdatePopup = z.object({
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  button_text: z.string().nullable().optional(),
  button_link: z.string().nullable().optional(),
  is_enabled: z.boolean().optional(),
  trigger_type: z.enum(["first_visit", "every_visit", "specific_page"]).optional(),
  display_frequency: z.enum(["once", "once_per_session", "once_per_day"]).optional(),
  target_page: z.string().nullable().optional(),
  sort_order: z.number().optional(),
})

export type PostAdminCreatePopupType = z.infer<typeof PostAdminCreatePopup>
export type PostAdminUpdatePopupType = z.infer<typeof PostAdminUpdatePopup>
