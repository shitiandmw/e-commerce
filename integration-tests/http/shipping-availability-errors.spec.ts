import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createPaymentCollectionForCartWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
} from "@medusajs/medusa/core-flows"
import { sign } from "jsonwebtoken"
import { SHIPPING_AVAILABILITY_MODULE } from "../../src/modules/shipping-availability"
import type ShippingAvailabilityModuleService from "../../src/modules/shipping-availability/service"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: { JWT_SECRET: "supersecret" },
  testSuite: ({ api, getContainer }) => {
    describe("shipping availability error contracts", () => {
      let emptyCartId: string
      let paymentCollectionId: string
      let storeHeaders: Record<string, string>
      let adminHeaders: Record<string, string>

      beforeEach(async () => {
        const container = getContainer()
        const config = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE) as any
        adminHeaders = {
          authorization: `Bearer ${sign(
            {
              actor_id: "user_shipping_test",
              actor_type: "user",
              auth_identity_id: "auth_shipping_test",
              app_metadata: {},
              user_metadata: {},
            },
            config.projectConfig.http.jwtSecret
          )}`,
        }
        const region = await (container.resolve(Modules.REGION) as any).createRegions({
          name: "Shipping error test region",
          currency_code: "usd",
          countries: ["us"],
        })
        const salesChannel = await (
          container.resolve(Modules.SALES_CHANNEL) as any
        ).createSalesChannels({ name: "Shipping error test channel" })
        const {
          result: [publishableKey],
        } = await createApiKeysWorkflow(container).run({
          input: {
            api_keys: [{
              title: "Shipping availability HTTP tests",
              type: "publishable",
              created_by: "",
            }],
          },
        })
        await linkSalesChannelsToApiKeyWorkflow(container).run({
          input: { id: publishableKey.id, add: [salesChannel.id] },
        })
        storeHeaders = { "x-publishable-api-key": publishableKey.token }
        api.defaults.headers.common["x-publishable-api-key"] = publishableKey.token
        const cart = await (container.resolve(Modules.CART) as any).createCarts({
          currency_code: "usd",
          region_id: region.id,
          sales_channel_id: salesChannel.id,
        })
        emptyCartId = cart.id
        const { result: paymentCollection } = await
          createPaymentCollectionForCartWorkflow(container).run({
            input: { cart_id: cart.id },
          })
        paymentCollectionId = paymentCollection.id
      })

      it("revalidates an existing collection before creating a provider payment session", async () => {
        const response = await api.post(
          `/store/payment-collections/${paymentCollectionId}/payment-sessions`,
          { provider_id: "pp_test" },
          { headers: storeHeaders, validateStatus: () => true }
        )

        expect(response.status).toBe(409)
        expect(response.data).toEqual({
          code: "SHIPPING_OPTION_REQUIRED",
          message: "A shipping option must be selected before checkout.",
          details: {},
        })
      })

      it("returns 409 for an invalid shipping-method workflow", async () => {
        const response = await api.post(
          `/store/carts/${emptyCartId}/shipping-methods`,
          { option_id: "so_unavailable" },
          { headers: storeHeaders, validateStatus: () => true }
        )

        expect(response.status).toBe(409)
        expect(response.data).toMatchObject({
          code: "SHIPPING_EMPTY_CART",
          message: "The cart is empty.",
          details: {},
        })
      })

      it("returns 409 before completing a cart without a shipping selection", async () => {
        const response = await api.post(
          `/store/carts/${emptyCartId}/complete`,
          {},
          { headers: storeHeaders, validateStatus: () => true }
        )

        expect(response.status).toBe(409)
        expect(response.data).toEqual({
          code: "SHIPPING_OPTION_REQUIRED",
          message: "A shipping option must be selected before checkout.",
          details: {},
        })
      })

      it("preserves safe-delete product counts in the 409 response", async () => {
        const service = getContainer().resolve(
          SHIPPING_AVAILABILITY_MODULE
        ) as ShippingAvailabilityModuleService
        await service.createProductShippingOptions({
          product_id: "prod_delete_guard",
          shipping_option_id: "so_delete_guard",
        })

        const response = await api.delete(
          "/admin/shipping-options/so_delete_guard/safe",
          { headers: adminHeaders, validateStatus: () => true }
        )

        expect(response.status).toBe(409)
        expect(response.data).toEqual({
          code: "SHIPPING_OPTION_IN_USE",
          message: "This shipping option is still assigned to products.",
          details: { product_count: 1 },
        })
      })
    })
  },
})
