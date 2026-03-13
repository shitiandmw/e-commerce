import { z } from "zod"

const TranslationsSchema = z.record(z.string(), z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  button_text: z.string().optional(),
})).optional()

export const PostAdminCreatePopup = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
  button_text: z.string().optional(),
  button_link: z.string().optional(),
  is_enabled: z.boolean().optional(),
  trigger_type: z.enum(["first_visit", "every_visit", "specific_page"]).optional(),
  display_frequency: z.enum(["once", "once_per_session", "once_per_day"]).optional(),
  target_page: z.string().optional(),
  sort_order: z.number().optional(),
  popup_type: z.enum(["general", "coupon"]).optional(),
  coupon_code: z.string().optional(),
  translations: TranslationsSchema,
})

export const PostAdminUpdatePopup = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
  button_text: z.string().optional(),
  button_link: z.string().optional(),
  is_enabled: z.boolean().optional(),
  trigger_type: z.enum(["first_visit", "every_visit", "specific_page"]).optional(),
  display_frequency: z.enum(["once", "once_per_session", "once_per_day"]).optional(),
  target_page: z.string().optional(),
  sort_order: z.number().optional(),
  popup_type: z.enum(["general", "coupon"]).optional(),
  coupon_code: z.string().optional(),
  translations: TranslationsSchema,
})

export type PostAdminCreatePopupType = z.infer<typeof PostAdminCreatePopup>
export type PostAdminUpdatePopupType = z.infer<typeof PostAdminUpdatePopup>
