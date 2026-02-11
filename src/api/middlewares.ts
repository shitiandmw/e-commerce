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

export const GetBrandsSchema = createFindParams()
export const GetPagesSchema = createFindParams()

export default defineMiddlewares({
  routes: [
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
  ],
})
