import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
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

export const GetBrandsSchema = createFindParams()
export const GetPagesSchema = createFindParams()
export const GetTagsSchema = createFindParams()
export const GetAnnouncementsSchema = createFindParams()

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
  ],
})
