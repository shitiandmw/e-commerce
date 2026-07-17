import {
  defineMiddlewares,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  validateAndTransformBody,
  validateAndTransformQuery,
  authenticate,
  errorHandler,
} from "@medusajs/framework/http"
import { PolicyOperation } from "@medusajs/framework/utils"
import { AdminGetOrdersParams } from "@medusajs/medusa/api/admin/orders/validators"
import { listTransformQueryConfig as adminOrdersListTransformQueryConfig } from "@medusajs/medusa/api/admin/orders/query-config"
import { AdminGetInventoryItemsParams } from "@medusajs/medusa/api/admin/inventory-items/validators"
import {
  listTransformQueryConfig as adminInventoryItemsListTransformQueryConfig,
  Entities as InventoryEntities,
} from "@medusajs/medusa/api/admin/inventory-items/query-config"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { z } from "zod"
import {
  PostAdminCreateBrand,
  PostAdminUpdateBrand,
} from "./admin/brands/validators"
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
import {
  PostAdminCreateAttributeTemplate,
  PostAdminUpdateAttributeTemplate,
} from "./admin/attribute-templates/validators"
import {
  couponMiddlewares,
} from "./store/content/coupon/validators"
import {
  AddWishlistItemSchema,
} from "./store/wishlist/validators"
import {
  PostStoreCreateConversation,
} from "./store/chat/validators"
import {
  PostAdminUpdateConversation,
  PostAdminUpdateChatSettings,
} from "./admin/chat/validators"
import {
  PostAdminUpdatePaymentSettings,
} from "./admin/payment-settings/validators"
import {
  PostAdminCreatePickupLocation,
  PostAdminUpdatePickupLocation,
} from "./admin/pickup-locations/validators"
import {
  PostAdminCreateTrackingRecord,
  PostAdminUpdateTrackingStatus,
} from "./admin/tracking/validators"
import {
  PostAdminChangeOwnPassword,
  PostAdminCreateAccountUser,
  PostAdminResetAccountUserPassword,
  PostAdminUpdateAccountUser,
} from "./admin/account-users/validators"
import {
  StoreAnonymousRestockRequestBody,
  StoreAnonymousRestockRequestQuery,
  StoreCustomerRestockRequestBody,
  StoreCustomerRestockRequestQuery,
} from "./store/restock-requests/validators"
import { initSocketIO, setContainer } from "../lib/socket-io"
import { PostAdminProductShippingOptions } from "./admin/products/[id]/shipping-options/validators"
import { PostAdminShippingOptionPickupLocation } from "./admin/shipping-options/[id]/pickup-location/validators"
import { PostAdminShippingOptionConfiguration } from "./admin/shipping-options/[id]/configuration/validators"
import { PostStoreRemoveIncompatibleItems } from "./store/carts/[id]/shipping-availability/validators"
import {
  assertShippingOptionCanBeDeleted,
  createShippingAvailabilityError,
  getShippingOptionPickupLocation,
  prepareCartShippingSnapshot,
  sendShippingAvailabilityError,
  SHIPPING_AVAILABILITY_ERROR_CODES,
} from "../lib/shipping-availability"

export const GetBrandsSchema = createFindParams().merge(z.object({ q: z.string().optional() }))
export const GetTagsSchema = createFindParams()
export const GetAnnouncementsSchema = createFindParams()
export const GetPopupsSchema = createFindParams()
export const GetBannerSlotsSchema = createFindParams()
export const GetBannerItemsSchema = createFindParams().merge(z.object({ slot_id: z.string().optional() }))
export const GetArticlesSchema = createFindParams().merge(z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  category_id: z.string().optional(),
}))
export const GetArticleCategoriesSchema = createFindParams()
export const GetCuratedCollectionsSchema = createFindParams()
export const GetMenusSchema = createFindParams()
export const GetAttributeTemplatesSchema = createFindParams()
export const GetPickupLocationsSchema = createFindParams()
const OrderDeliveryStatusParam = z.union([z.string(), z.array(z.string())]).optional()
export const GetOrdersDeliverySchema = AdminGetOrdersParams.merge(z.object({
  delivery_type: z.enum(["pickup", "delivery"]),
  payment_status: OrderDeliveryStatusParam,
  "payment_status[]": OrderDeliveryStatusParam,
  fulfillment_status: OrderDeliveryStatusParam,
  "fulfillment_status[]": OrderDeliveryStatusParam,
}))
export const GetInventorySummarySchema = AdminGetInventoryItemsParams

export const GetConversationsSchema = createFindParams().merge(z.object({
  q: z.string().optional(),
  status: z.string().optional(),
}))

export const GetRestockDemandsSchema = z.object({
  status: z.enum(["pending", "restocked", "all"]).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export const GetStoreContentSchema = createFindParams().merge(z.object({
  locale: z.string().optional(),
  q: z.string().optional(),
  category: z.string().optional(),
}))

const verifyStoreOrderOwnership = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const customerId = (req as any).auth_context?.actor_id
  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const { id } = req.params
  const query = req.scope.resolve("query")

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id"],
    filters: { id },
  })

  const order = orders?.[0] as { customer_id?: string | null } | undefined
  if (!order || order.customer_id !== customerId) {
    return res.status(404).json({ message: "Order not found" })
  }

  return next()
}

const preparePaymentCartShipping = async (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const cartId = (req.body as any)?.cart_id
  if (!cartId) return next()
  await prepareCartShippingSnapshot(req.scope, cartId)
  return next()
}

export const preparePaymentSessionCartShipping = async (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const query = req.scope.resolve("query")
  const { data } = await query.graph({
    entity: "cart_payment_collection",
    fields: ["cart_id"],
    filters: { payment_collection_id: req.params.id },
  })
  const cartId = (data?.[0] as { cart_id?: string } | undefined)?.cart_id
  if (!cartId) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.PAYMENT_COLLECTION_CART_NOT_FOUND,
      "This payment collection is not linked to a cart.",
      { payment_collection_id: req.params.id }
    )
  }

  await prepareCartShippingSnapshot(req.scope, cartId)
  return next()
}

export const prepareCompletedCartShipping = async (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  await prepareCartShippingSnapshot(req.scope, req.params.id)
  return next()
}

const protectNativeShippingOptionDelete = async (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  await assertShippingOptionCanBeDeleted(req.scope, req.params.id)
  const binding = await getShippingOptionPickupLocation(req.scope, req.params.id)
  if (binding.pickup_location_id) {
    throw createShippingAvailabilityError(
      SHIPPING_AVAILABILITY_ERROR_CODES.SAFE_DELETE_REQUIRED,
      "Delete pickup shipping options through the safe delete endpoint."
    )
  }
  return next()
}

const coreErrorHandler = errorHandler()

export default defineMiddlewares({
  errorHandler: (err, req, res, next) => {
    if (sendShippingAvailabilityError(res, err)) return
    return coreErrorHandler(err, req, res, next)
  },
  routes: [
    {
      matcher: "/admin/products/:id/shipping-options",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminProductShippingOptions)],
    },
    {
      matcher: "/admin/shipping-options/:id/configuration",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminShippingOptionConfiguration),
      ],
    },
    {
      matcher: "/admin/shipping-options/:id/pickup-location",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminShippingOptionPickupLocation),
      ],
    },
    {
      matcher: "/admin/shipping-options/:id",
      method: "DELETE",
      middlewares: [protectNativeShippingOptionDelete],
    },
    {
      matcher:
        "/store/carts/:id/shipping-availability/remove-incompatible-items",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostStoreRemoveIncompatibleItems),
      ],
    },
    {
      matcher: "/store/payment-collections",
      method: "POST",
      middlewares: [preparePaymentCartShipping],
    },
    {
      matcher: "/store/payment-collections/:id/payment-sessions",
      method: "POST",
      middlewares: [preparePaymentSessionCartShipping],
    },
    {
      matcher: "/store/carts/:id/complete",
      method: "POST",
      middlewares: [prepareCompletedCartShipping],
    },
    // Store content routes
    {
      matcher: "/store/content/articles",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetStoreContentSchema,
          {
            defaults: [
              "id", "title", "slug", "cover_image", "summary",
              "status", "published_at", "sort_order", "is_pinned",
              "category_id", "category.*", "seo",
              "created_at", "updated_at",
            ],
            isList: true,
          }
        ),
      ],
    },
    {
      matcher: "/store/content/articles/:slug",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetStoreContentSchema,
          {
            defaults: [
              "id", "title", "slug", "cover_image", "summary", "content",
              "status", "published_at", "sort_order", "is_pinned",
              "category_id", "category.*", "seo",
              "created_at", "updated_at",
            ],
            isList: false,
          }
        ),
      ],
    },
    // Store content pages routes (backed by article table)
    {
      matcher: "/store/content/pages",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetStoreContentSchema,
          {
            defaults: [
              "id", "title", "slug", "cover_image", "summary", "content",
              "status", "published_at", "sort_order", "is_pinned",
              "category_id", "category.*", "seo",
              "created_at", "updated_at",
            ],
            isList: true,
          }
        ),
      ],
    },
    {
      matcher: "/store/content/pages/:slug",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetStoreContentSchema,
          {
            defaults: [
              "id", "title", "slug", "cover_image", "summary", "content",
              "status", "published_at", "sort_order", "is_pinned",
              "category_id", "category.*", "seo",
              "created_at", "updated_at",
            ],
            isList: false,
          }
        ),
      ],
    },
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
    // Order delivery type filter route mirrors native order list read policy.
    {
      matcher: "/admin/orders-delivery",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetOrdersDeliverySchema,
          adminOrdersListTransformQueryConfig
        ),
      ],
      policies: [
        {
          resource: "order",
          operation: PolicyOperation.read,
        },
      ],
    },
    {
      matcher: "/admin/inventory-summary",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetInventorySummarySchema,
          adminInventoryItemsListTransformQueryConfig
        ),
      ],
      policies: [
        {
          resource: InventoryEntities.inventory_item,
          operation: PolicyOperation.read,
        },
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
              "sort_order", "popup_type", "coupon_code",
              "created_at", "updated_at",
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
              "link_url", "cta_text", "sort_order", "is_enabled",
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
              "category_id", "category.*", "seo",
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
              "sort_order", "parent_id", "parent.*", "children.*",
              "created_at", "updated_at",
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
              "items.id",
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
    // Coupon claim route
    ...couponMiddlewares,
    // Attribute Template routes
    {
      matcher: "/admin/attribute-templates",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetAttributeTemplatesSchema,
          {
            defaults: ["id", "name", "attributes", "created_at", "updated_at"],
            isList: true,
          }
        ),
      ],
    },
    {
      matcher: "/admin/attribute-templates",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateAttributeTemplate),
      ],
    },
    {
      matcher: "/admin/attribute-templates/:id",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateAttributeTemplate),
      ],
    },
    // Tracking routes (admin)
    {
      matcher: "/admin/tracking",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateTrackingRecord),
      ],
    },
    {
      matcher: "/admin/tracking/:id",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateTrackingStatus),
      ],
    },
    // Admin account users routes
    {
      matcher: "/admin/account-users",
      method: "GET",
      middlewares: [
        authenticate("user", ["bearer", "session"]),
      ],
    },
    {
      matcher: "/admin/account-users/me",
      method: "GET",
      middlewares: [
        authenticate("user", ["bearer", "session"]),
      ],
    },
    {
      matcher: "/admin/account-users",
      method: "POST",
      middlewares: [
        authenticate("user", ["bearer", "session"]),
        validateAndTransformBody(PostAdminCreateAccountUser),
      ],
    },
    {
      matcher: "/admin/account-users/:id/reset-password",
      method: "POST",
      middlewares: [
        authenticate("user", ["bearer", "session"]),
        validateAndTransformBody(PostAdminResetAccountUserPassword),
      ],
    },
    {
      matcher: "/admin/account-users/me/change-password",
      method: "POST",
      middlewares: [
        authenticate("user", ["bearer", "session"]),
        validateAndTransformBody(PostAdminChangeOwnPassword),
      ],
    },
    {
      matcher: "/admin/account-users/:id",
      method: "POST",
      middlewares: [
        authenticate("user", ["bearer", "session"]),
        validateAndTransformBody(PostAdminUpdateAccountUser),
      ],
    },
    // Store order details must be scoped to the authenticated customer.
    {
      matcher: "/store/orders/:id",
      method: "GET",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        verifyStoreOrderOwnership,
      ],
    },
    // Store tracking route (customer authentication required)
    {
      matcher: "/store/tracking/:orderId",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
      ],
    },
    // Wishlist routes (customer authentication required)
    {
      matcher: "/store/wishlist",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
      ],
    },
    // Restock demand routes. Visitors use the public route with a stable
    // browser ID; signed-in customers use the authenticated sub-route.
    {
      matcher: "/store/restock-requests/customer",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
      ],
    },
    {
      matcher: "/store/restock-requests",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(StoreAnonymousRestockRequestQuery, {
          defaults: [],
          isList: false,
        }),
      ],
    },
    {
      matcher: "/store/restock-requests",
      method: "POST",
      middlewares: [validateAndTransformBody(StoreAnonymousRestockRequestBody)],
    },
    {
      matcher: "/store/restock-requests/customer",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(StoreCustomerRestockRequestQuery, {
          defaults: [],
          isList: false,
        }),
      ],
    },
    {
      matcher: "/store/restock-requests/customer",
      method: "POST",
      middlewares: [validateAndTransformBody(StoreCustomerRestockRequestBody)],
    },
    {
      matcher: "/admin/restock-demands",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetRestockDemandsSchema, {
          defaults: [],
          isList: true,
        }),
      ],
    },
    {
      matcher: "/store/wishlist/:id",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
      ],
    },
    {
      matcher: "/store/wishlist",
      method: "POST",
      middlewares: [
        validateAndTransformBody(AddWishlistItemSchema),
      ],
    },
    // Socket.io lazy initialization — triggers on first chat-related request
    {
      matcher: "/admin/chat/**",
      middlewares: [
        (req, _res, next) => {
          initSocketIO()
          setContainer(req.scope)
          next()
        },
      ],
    },
    {
      matcher: "/store/chat/**",
      middlewares: [
        (req, _res, next) => {
          initSocketIO()
          setContainer(req.scope)
          next()
        },
      ],
    },
    {
      matcher: "/chat/**",
      middlewares: [
        (req, _res, next) => {
          initSocketIO()
          setContainer(req.scope)
          next()
        },
      ],
    },
    // Chat store routes (no auth required - visitors can chat)
    {
      matcher: "/store/chat/conversations",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostStoreCreateConversation),
      ],
    },
    // Chat admin routes
    {
      matcher: "/admin/chat/conversations",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetConversationsSchema,
          {
            defaults: [
              "id", "visitor_id", "customer_id", "assigned_agent_id",
              "status", "last_message_preview", "last_message_at",
              "unread_count", "created_at", "updated_at",
            ],
            isList: true,
          }
        ),
      ],
    },
    {
      matcher: "/admin/chat/conversations/:id",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateConversation),
      ],
    },
    {
      matcher: "/admin/chat/settings",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdateChatSettings),
      ],
    },
    // Payment settings routes
    {
      matcher: "/admin/payment-settings",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdatePaymentSettings),
      ],
    },
    // Pickup location routes
    {
      matcher: "/admin/pickup-locations",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetPickupLocationsSchema,
          {
            defaults: [
              "id", "name", "address", "phone", "hours", "note",
              "sort_order", "is_enabled", "created_at", "updated_at",
            ],
            isList: true,
          }
        ),
      ],
    },
    {
      matcher: "/admin/pickup-locations",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreatePickupLocation),
      ],
    },
    {
      matcher: "/admin/pickup-locations/:id",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminUpdatePickupLocation),
      ],
    },
  ],
})
