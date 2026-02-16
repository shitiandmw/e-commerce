import { z } from "zod"

// Collection validators
export const PostAdminCreateCuratedCollection = z.object({
  name: z.string().min(1),
  key: z.string().min(1),
  description: z.string().optional(),
  sort_order: z.number().int().optional(),
})

export const PostAdminUpdateCuratedCollection = z.object({
  name: z.string().min(1).optional(),
  key: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
})

// Tab validators
export const PostAdminCreateCollectionTab = z.object({
  name: z.string().min(1),
  key: z.string().min(1),
  sort_order: z.number().int().optional(),
})

export const PostAdminUpdateCollectionTab = z.object({
  name: z.string().min(1).optional(),
  key: z.string().min(1).optional(),
  sort_order: z.number().int().optional(),
})

// Item validators
export const PostAdminAddCollectionItem = z.object({
  product_id: z.string().min(1),
  tab_id: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
})

export const PostAdminUpdateCollectionItem = z.object({
  tab_id: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
})

export type PostAdminCreateCuratedCollectionType = z.infer<typeof PostAdminCreateCuratedCollection>
export type PostAdminUpdateCuratedCollectionType = z.infer<typeof PostAdminUpdateCuratedCollection>
export type PostAdminCreateCollectionTabType = z.infer<typeof PostAdminCreateCollectionTab>
export type PostAdminUpdateCollectionTabType = z.infer<typeof PostAdminUpdateCollectionTab>
export type PostAdminAddCollectionItemType = z.infer<typeof PostAdminAddCollectionItem>
export type PostAdminUpdateCollectionItemType = z.infer<typeof PostAdminUpdateCollectionItem>
