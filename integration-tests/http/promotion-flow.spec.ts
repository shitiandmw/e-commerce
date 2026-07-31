import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createProductsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
} from "@medusajs/medusa/core-flows"
import { sign } from "jsonwebtoken"
import { POPUP_MODULE } from "../../src/modules/popup"
import type PopupModuleService from "../../src/modules/popup/service"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    describe("promotion cart flow", () => {
      let cartId: string
      let adminHeaders: Record<string, string>
      let storeHeaders: Record<string, string>

      beforeEach(async () => {
        const container = getContainer()
        const config = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE) as any
        adminHeaders = {
          authorization: `Bearer ${sign(
            {
              actor_id: "user_promotion_test",
              actor_type: "user",
              auth_identity_id: "auth_promotion_test",
              app_metadata: {},
              user_metadata: {},
            },
            config.projectConfig.http.jwtSecret
          )}`,
        }
        const region = await (container.resolve(Modules.REGION) as any)
          .createRegions({
            name: "Promotion test region",
            currency_code: "usd",
            countries: ["us"],
          })
        const salesChannel = await (
          container.resolve(Modules.SALES_CHANNEL) as any
        ).createSalesChannels({ name: "Promotion test channel" })
        const {
          result: [publishableKey],
        } = await createApiKeysWorkflow(container).run({
          input: {
            api_keys: [{
              title: "Promotion HTTP tests",
              type: "publishable",
              created_by: "",
            }],
          },
        })
        await linkSalesChannelsToApiKeyWorkflow(container).run({
          input: { id: publishableKey.id, add: [salesChannel.id] },
        })
        storeHeaders = { "x-publishable-api-key": publishableKey.token }

        const cart = await (container.resolve(Modules.CART) as any).createCarts({
          currency_code: "usd",
          region_id: region.id,
          sales_channel_id: salesChannel.id,
          email: "promotion@example.com",
          items: [{
            title: "Promotion test item",
            quantity: 3,
            unit_price: 100,
            is_discountable: true,
            requires_shipping: false,
            is_custom_price: true,
          }],
        })
        cartId = cart.id
      })

      it("applies an active order promotion to every unit and removes it", async () => {
        const createResponse = await api.post(
          "/admin/promotions",
          {
            code: "ORDER10",
            type: "standard",
            status: "active",
            is_automatic: false,
            application_method: {
              type: "percentage",
              value: 10,
              target_type: "order",
            },
          },
          { headers: adminHeaders, validateStatus: () => true }
        )
        expect(createResponse.status).toBe(200)
        expect(createResponse.data.promotion).toMatchObject({
          code: "ORDER10",
          status: "active",
        })

        const applyResponse = await api.post(
          `/store/carts/${cartId}/promotions?fields=*items,*items.variant,*items.variant.product`,
          { promo_codes: ["ORDER10"] },
          { headers: storeHeaders, validateStatus: () => true }
        )

        expect(applyResponse.status).toBe(200)
        expect(applyResponse.data.cart.promotions).toEqual(
          expect.arrayContaining([expect.objectContaining({ code: "ORDER10" })])
        )
        expect(applyResponse.data.cart.subtotal).toBe(300)
        expect(applyResponse.data.cart.discount_total).toBe(30)
        expect(applyResponse.data.cart.total).toBe(270)

        const removeResponse = await api.delete(
          `/store/carts/${cartId}/promotions?fields=*items,*items.variant,*items.variant.product`,
          {
            headers: storeHeaders,
            data: { promo_codes: ["ORDER10"] },
            validateStatus: () => true,
          }
        )

        expect(removeResponse.status).toBe(200)
        expect(removeResponse.data.cart.promotions).toEqual([])
        expect(removeResponse.data.cart.discount_total).toBe(0)
        expect(removeResponse.data.cart.total).toBe(300)
      })

      it("caps a fixed order coupon at the eligible merchandise total", async () => {
        const createResponse = await api.post(
          "/admin/promotions",
          {
            code: "FIXED500",
            type: "standard",
            status: "active",
            is_automatic: false,
            application_method: {
              type: "fixed",
              value: 500,
              currency_code: "usd",
              target_type: "order",
            },
          },
          { headers: adminHeaders, validateStatus: () => true }
        )
        expect(createResponse.status).toBe(200)

        const applyResponse = await api.post(
          `/store/carts/${cartId}/promotions?fields=*items,*items.variant,*items.variant.product`,
          { promo_codes: ["FIXED500"] },
          { headers: storeHeaders, validateStatus: () => true }
        )

        expect(applyResponse.status).toBe(200)
        expect(applyResponse.data.cart.subtotal).toBe(300)
        expect(applyResponse.data.cart.discount_total).toBe(300)
        expect(applyResponse.data.cart.total).toBe(0)
      })

      it("requires the current manual coupon to be removed before another is applied", async () => {
        for (const code of ["FIRST10", "SECOND10"]) {
          const createResponse = await api.post(
            "/admin/promotions",
            {
              code,
              type: "standard",
              status: "active",
              is_automatic: false,
              application_method: {
                type: "percentage",
                value: 10,
                target_type: "order",
              },
            },
            { headers: adminHeaders, validateStatus: () => true }
          )
          expect(createResponse.status).toBe(200)
        }

        const firstResponse = await api.post(
          `/store/carts/${cartId}/promotions`,
          { promo_codes: ["FIRST10"] },
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(firstResponse.status).toBe(200)

        const secondResponse = await api.post(
          `/store/carts/${cartId}/promotions`,
          { promo_codes: ["SECOND10"] },
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(secondResponse.status).toBe(400)
        expect(secondResponse.data.message).toBe(
          "Remove the current discount code before applying another one."
        )
      })

      it("discounts only the products selected by an item promotion", async () => {
        const container = getContainer()
        const cartService = getContainer().resolve(Modules.CART) as any
        const sourceCart = await cartService.retrieveCart(cartId)
        const fulfillmentService = container.resolve(Modules.FULFILLMENT) as any
        const shippingProfile = await fulfillmentService.createShippingProfiles({
          name: "Selected product promotion profile",
          type: "default",
        })
        const { result: [selectedProduct, otherProduct] } =
          await createProductsWorkflow(container).run({
            input: {
              products: [
                {
                  title: "Selected product",
                  handle: "promotion-selected-product",
                  status: ProductStatus.PUBLISHED,
                  shipping_profile_id: shippingProfile.id,
                  options: [{ title: "Size", values: ["Small", "Large"] }],
                  variants: [
                    {
                      title: "Small",
                      sku: "PROMOTION-SELECTED-SMALL",
                      manage_inventory: false,
                      options: { Size: "Small" },
                      prices: [{ amount: 100, currency_code: "usd" }],
                    },
                    {
                      title: "Large",
                      sku: "PROMOTION-SELECTED-LARGE",
                      manage_inventory: false,
                      options: { Size: "Large" },
                      prices: [{ amount: 100, currency_code: "usd" }],
                    },
                  ],
                  sales_channels: [{ id: sourceCart.sales_channel_id }],
                },
                {
                  title: "Other product",
                  handle: "promotion-other-product",
                  status: ProductStatus.PUBLISHED,
                  shipping_profile_id: shippingProfile.id,
                  options: [{ title: "Default", values: ["Default"] }],
                  variants: [{
                    title: "Default",
                    sku: "PROMOTION-OTHER-DEFAULT",
                    manage_inventory: false,
                    options: { Default: "Default" },
                    prices: [{ amount: 100, currency_code: "usd" }],
                  }],
                  sales_channels: [{ id: sourceCart.sales_channel_id }],
                },
              ],
            },
          })
        const selectedProductCart = await cartService.createCarts({
          currency_code: "usd",
          region_id: sourceCart.region_id,
          sales_channel_id: sourceCart.sales_channel_id,
          email: "selected-product-promotion@example.com",
        })
        for (const variantId of [
          selectedProduct.variants[0].id,
          selectedProduct.variants[1].id,
          otherProduct.variants[0].id,
        ]) {
          const lineItemResponse = await api.post(
            `/store/carts/${selectedProductCart.id}/line-items`,
            { variant_id: variantId, quantity: 1 },
            { headers: storeHeaders, validateStatus: () => true }
          )
          expect(lineItemResponse.status).toBe(200)
        }

        const createResponse = await api.post(
          "/admin/promotions?fields=+application_method.target_rules",
          {
            code: "SELECTED10",
            type: "standard",
            status: "active",
            is_automatic: false,
            application_method: {
              type: "percentage",
              value: 10,
              target_type: "items",
              allocation: "across",
              target_rules: [
                {
                  attribute: "items.product.id",
                  operator: "eq",
                  values: [selectedProduct.id],
                },
              ],
            },
          },
          { headers: adminHeaders, validateStatus: () => true }
        )

        expect(createResponse.status).toBe(200)
        expect(createResponse.data.promotion.application_method.target_rules)
          .toEqual(expect.arrayContaining([
            expect.objectContaining({
              attribute: "items.product.id",
              operator: "eq",
            }),
          ]))

        const applyResponse = await api.post(
          `/store/carts/${selectedProductCart.id}/promotions?fields=*items,*items.variant,*items.variant.product`,
          { promo_codes: ["SELECTED10"] },
          { headers: storeHeaders, validateStatus: () => true }
        )

        expect(applyResponse.status).toBe(200)
        expect(applyResponse.data.cart.subtotal).toBe(300)
        expect(applyResponse.data.cart.discount_total).toBe(20)
        expect(applyResponse.data.cart.total).toBe(280)

        const targetRule = createResponse.data.promotion.application_method
          .target_rules[0]
        const clearResponse = await api.post(
          `/admin/promotions/${createResponse.data.promotion.id}/target-rules/batch`,
          { delete: [targetRule.id] },
          { headers: adminHeaders, validateStatus: () => true }
        )
        expect(clearResponse.status).toBe(200)

        const retrieveResponse = await api.get(
          `/admin/promotions/${createResponse.data.promotion.id}?fields=+application_method.target_rules`,
          { headers: adminHeaders, validateStatus: () => true }
        )
        expect(retrieveResponse.status).toBe(200)
        expect(
          retrieveResponse.data.promotion.application_method.target_rules
        ).toEqual([])
      })

      it("returns an unchanged cart when an existing promotion is not active", async () => {
        const promotionService = getContainer().resolve(Modules.PROMOTION) as any
        await promotionService.createPromotions({
          code: "DRAFT10",
          type: "standard",
          status: "draft",
          is_automatic: false,
          application_method: {
            type: "percentage",
            value: 10,
            target_type: "order",
          },
        })

        const response = await api.post(
          `/store/carts/${cartId}/promotions?fields=*items,*items.variant,*items.variant.product`,
          { promo_codes: ["DRAFT10"] },
          { headers: storeHeaders, validateStatus: () => true }
        )

        expect(response.status).toBe(200)
        expect(response.data.cart.promotions).toEqual([])
        expect(response.data.cart.discount_total).toBe(0)
        expect(response.data.cart.total).toBe(300)
      })

      it("creates a scheduled campaign through the promotion admin contract", async () => {
        const startsAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
        const endsAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        const response = await api.post(
          "/admin/promotions",
          {
            code: "SCHEDULED10",
            type: "standard",
            status: "active",
            is_automatic: false,
            application_method: {
              type: "percentage",
              value: 10,
              target_type: "order",
            },
            campaign: {
              name: "SCHEDULED10 schedule",
              campaign_identifier: "scheduled10-test",
              starts_at: startsAt,
              ends_at: endsAt,
            },
          },
          { headers: adminHeaders, validateStatus: () => true }
        )

        expect(response.status).toBe(200)
        expect(response.data.promotion.campaign).toMatchObject({
          campaign_identifier: "scheduled10-test",
        })
        expect(new Date(response.data.promotion.campaign.starts_at).toISOString())
          .toBe(startsAt)
        expect(new Date(response.data.promotion.campaign.ends_at).toISOString())
          .toBe(endsAt)
      })

      it("only issues coupon-popup codes backed by an active manual promotion", async () => {
        const promotionService = getContainer().resolve(Modules.PROMOTION) as any
        const popupService = getContainer().resolve(POPUP_MODULE) as PopupModuleService
        await promotionService.createPromotions({
          code: "CLAIM10",
          type: "standard",
          status: "active",
          is_automatic: false,
          application_method: {
            type: "percentage",
            value: 10,
            target_type: "order",
          },
        })
        const popup = await popupService.createPopups({
          title: "Claim promotion",
          is_enabled: true,
          popup_type: "coupon",
          coupon_code: "claim10",
        })

        const activeResponse = await api.post(
          "/store/content/coupon",
          { popup_id: popup.id, email: "claim@example.com" },
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(activeResponse.status).toBe(200)
        expect(activeResponse.data).toMatchObject({
          success: true,
          coupon_code: "CLAIM10",
        })

        const activeHomeResponse = await api.get("/store/content/home", {
          headers: storeHeaders,
          validateStatus: () => true,
        })
        expect(activeHomeResponse.status).toBe(200)
        expect(activeHomeResponse.data.popups).toEqual(
          expect.arrayContaining([expect.objectContaining({ id: popup.id })])
        )

        await promotionService.updatePromotions({
          id: (await promotionService.listPromotions({ code: "CLAIM10" }))[0].id,
          status: "inactive",
        })
        const inactiveResponse = await api.post(
          "/store/content/coupon",
          { popup_id: popup.id, email: "claim@example.com" },
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(inactiveResponse.status).not.toBe(200)
        expect(inactiveResponse.data.message).toBe(
          "This coupon is no longer available"
        )

        const inactiveHomeResponse = await api.get("/store/content/home", {
          headers: storeHeaders,
          validateStatus: () => true,
        })
        expect(inactiveHomeResponse.status).toBe(200)
        expect(inactiveHomeResponse.data.popups).not.toEqual(
          expect.arrayContaining([expect.objectContaining({ id: popup.id })])
        )
      })
    })
  },
})
