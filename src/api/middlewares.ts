import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { z } from "zod"
import {
  PostAdminCreateBrand,
  PostAdminUpdateBrand,
} from "./admin/brands/validators"
import {
  PostAdminCreatePage,
  PostAdminUpdatePage,
} from "./admin/pages/validators"
import {
  PostAdminCreateTag,
  PostAdminUpdateTag,
  PostAdminLinkProductTag,
} from "./admin/tags/validators"
import {
  PostAdminCreateAnnouncement,
  PostAdminUpdateAnnouncement,
} from "./admin/announcements/validators"
import {
  PostAdminCreatePopup,
  PostAdminUpdatePopup,
} from "./admin/popups/validators"
import {
  PostAdminCreateBannerSlot,
  PostAdminUpdateBannerSlot,
} from "./admin/banner-slots/validators"
import {
  PostAdminCreateBannerItem,
  PostAdminUpdateBannerItem,
} from "./admin/banner-items/validators"
import {
  PostAdminCreateArticle,
  PostAdminUpdateArticle,
} from "./admin/articles/validators"
import {
  PostAdminCreateArticleCategory,
  PostAdminUpdateArticleCategory,
} from "./admin/article-categories/validators"
import {
  PostAdminCreateCuratedCollection,
  PostAdminUpdateCuratedCollection,
  PostAdminCreateCollectionTab,
  PostAdminUpdateCollectionTab,
  PostAdminAddCollectionItem,
  PostAdminUpdateCollectionItem,
} from "./admin/curated-collections/validators"
import {
  PostAdminCreateMenu,
  PostAdminUpdateMenu,
} from "./admin/menus/validators"
import {
  PostAdminCreateMenuItem,
  PostAdminUpdateMenuItem,
  PostAdminReorderMenuItems,
} from "./admin/menu-items/validators"

export const GetBrandsSchema = createFindParams().merge(z.object({ q: z.string().optional() }))
export const GetPagesSchema = createFindParams()
export const GetTagsSchema = createFindParams()
export const GetAnnouncementsSchema = createFindParams()
export const GetPopupsSchema = createFindParams()
export const GetBannerSlotsSchema = createFindParams()
export const GetBannerItemsSchema = createFindParams()
export const GetArticlesSchema = createFindParams()
export const GetArticleCategoriesSchema = createFindParams()
export const GetCuratedCollectionsSchema = createFindParams()
export const GetMenusSchema = createFindParams()

export default defineMiddlewares({
  routes: [
    // Brand routes
    {
      matcher: "/admin/brands",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetBrandsSchema,
          {
            defaults: ["id", "name", "description", "logo_url", "created_at", "updated_at"],
            isList: true,
          }
        ),
      ],
    },
    {
      matcher: "/admin/brands",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateBrand),
      ],
    },
    {
      matcher: "/admin/brands/:id",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateBrand),
      ],
    },
    // Page routes
    {
      matcher: "/admin/pages",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetPagesSchema,
          {
            defaults: ["id", "title", "slug", "content", "status", "template", "sort_order", "created_at", "updated_at"],
            isList: true,
          }
        ),
      ],
    },
    {
      matcher: "/admin/pages",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreatePage),
      ],
    },
    {
      matcher: "/admin/pages/:id",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdatePage),
      ],
    },
    // Tag routes
    {
      matcher: "/admin/tags",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetTagsSchema,
          {
            defaults: ["id", "name", "color", "type", "created_at", "updated_at"],
            isList: true,
          }
        ),
      ],
    },
    {
      matcher: "/admin/tags",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateTag),
      ],
    },
    {
      matcher: "/admin/tags/:id",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateTag),
      ],
    },
    {
      matcher: "/admin/tags/:id/products",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminLinkProductTag),
      ],
    },
    {
      matcher: "/admin/tags/:id/products",
      method: "DELETE",
      middlewares: [
        validateAndTransformBody(PostAdminLinkProductTag),
      ],
    },
    // Announcement routes
    {
      matcher: "/admin/announcements",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetAnnouncementsSchema,
          {
            defaults: [
              "id",
              "text",
              "link_url",
              "sort_order",
              "is_enabled",
              "starts_at",
              "ends_at",
              "created_at",
              "updated_at",
            ],
            isList: true,
          }
        ),
      ],
    },
    {
      matcher: "/admin/announcements",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateAnnouncement),
      ],
    },
    {
      matcher: "/admin/announcements/:id",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateAnnouncement),
      ],
    },
    // Popup routes
    {
      matcher: "/admin/popups",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetPopupsSchema,
          {
            defaults: [
              "id", "title", "description", "image_url",
              "button_text", "button_link", "is_enabled",
              "trigger_type", "display_frequency", "target_page",
              "sort_order", "created_at", "updated_at",
            ],
            isList: true,
          }
        ),
      ],
    },
    {
      matcher: "/admin/popups",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreatePopup),
      ],
    },
    {
      matcher: "/admin/popups/:id",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdatePopup),
      ],
    },
    // Banner Slot routes
    {
      matcher: "/admin/banner-slots",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetBannerSlotsSchema,
          {
            defaults: ["id", "name", "key", "description", "created_at", "updated_at"],
            isList: true,
          }
        ),
      ],
    },
    {
      matcher: "/admin/banner-slots",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateBannerSlot),
      ],
    },
    {
      matcher: "/admin/banner-slots/:id",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateBannerSlot),
      ],
    },
    // Banner Item routes
    {
      matcher: "/admin/banner-items",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetBannerItemsSchema,
          {
            defaults: [
              "id", "slot_id", "image_url", "title", "subtitle",
              "link_url", "sort_order", "is_enabled",
              "starts_at", "ends_at", "created_at", "updated_at",
            ],
            isList: true,
          }
        ),
      ],
    },
    {
      matcher: "/admin/banner-items",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateBannerItem),
      ],
    },
    {
      matcher: "/admin/banner-items/:id",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateBannerItem),
      ],
    },
    // Article routes
    {
      matcher: "/admin/articles",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetArticlesSchema,
          {
            defaults: [
              "id", "title", "slug", "cover_image", "summary",
              "status", "published_at", "sort_order", "is_pinned",
              "created_at", "updated_at",
            ],
            isList: true,
          }
        ),
      ],
    },
    {
      matcher: "/admin/articles",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateArticle),
      ],
    },
    {
      matcher: "/admin/articles/:id",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateArticle),
      ],
    },
    // Article Category routes
    {
      matcher: "/admin/article-categories",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetArticleCategoriesSchema,
          {
            defaults: [
              "id", "name", "handle", "description",
              "sort_order", "created_at", "updated_at",
            ],
            isList: true,
          }
        ),
      ],
    },
    {
      matcher: "/admin/article-categories",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateArticleCategory),
      ],
    },
    {
      matcher: "/admin/article-categories/:id",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateArticleCategory),
      ],
    },
    // Curated Collection routes
    {
      matcher: "/admin/curated-collections",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetCuratedCollectionsSchema,
          {
            defaults: [
              "id", "name", "key", "description",
              "sort_order", "created_at", "updated_at",
            ],
            isList: true,
          }
        ),
      ],
    },
    {
      matcher: "/admin/curated-collections",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateCuratedCollection),
      ],
    },
    {
      matcher: "/admin/curated-collections/:id",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateCuratedCollection),
      ],
    },
    // Collection Tab routes
    {
      matcher: "/admin/curated-collections/:id/tabs",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateCollectionTab),
      ],
    },
    {
      matcher: "/admin/curated-collections/:id/tabs/:tabId",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateCollectionTab),
      ],
    },
    // Collection Item routes
    {
      matcher: "/admin/curated-collections/:id/items",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminAddCollectionItem),
      ],
    },
    {
      matcher: "/admin/curated-collections/:id/items/:itemId",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateCollectionItem),
      ],
    },
    // Menu routes
    {
      matcher: "/admin/menus",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetMenusSchema,
          {
            defaults: ["id", "name", "key", "description", "created_at", "updated_at"],
            isList: true,
          }
        ),
      ],
    },
    {
      matcher: "/admin/menus",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateMenu),
      ],
    },
    {
      matcher: "/admin/menus/:id",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateMenu),
      ],
    },
    // Menu item routes
    {
      matcher: "/admin/menus/:id/items",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateMenuItem),
      ],
    },
    {
      matcher: "/admin/menus/:id/items/:itemId",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateMenuItem),
      ],
    },
    {
      matcher: "/admin/menus/:id/reorder",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminReorderMenuItems),
      ],
    },
  ],
})
