import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createProductsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"
import { SHIPPING_AVAILABILITY_MODULE } from "../../src/modules/shipping-availability"
import type ShippingAvailabilityModuleService from "../../src/modules/shipping-availability/service"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    describe("checkout incompatible item removal", () => {
      let storeHeaders: Record<string, string>
      let regionId: string
      let salesChannelId: string
      let shippingOptionId: string
      let incompatibleVariantAId: string
      let incompatibleVariantBId: string
      let compatibleVariantId: string

      beforeEach(async () => {
        const container = getContainer()
        const link = container.resolve(ContainerRegistrationKeys.LINK) as any
        const fulfillment = container.resolve(Modules.FULFILLMENT) as any
        const shippingAvailability = container.resolve(
          SHIPPING_AVAILABILITY_MODULE
        ) as ShippingAvailabilityModuleService

        const region = await (container.resolve(Modules.REGION) as any)
          .createRegions({
            name: "Incompatible removal test region",
            currency_code: "usd",
            countries: ["us"],
          })
        regionId = region.id
        const salesChannel = await (
          container.resolve(Modules.SALES_CHANNEL) as any
        ).createSalesChannels({ name: "Incompatible removal channel" })
        salesChannelId = salesChannel.id
        const { result: [publishableKey] } = await createApiKeysWorkflow(
          container
        ).run({
          input: {
            api_keys: [{
              title: "Incompatible removal HTTP tests",
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

        const { result: [stockLocation] } = await createStockLocationsWorkflow(
          container
        ).run({
          input: {
            locations: [{
              name: "Incompatible removal stock location",
              address: {
                address_1: "1 Main Street",
                city: "New York",
                country_code: "US",
              },
            }],
          },
        })
        await link.create({
          [Modules.STOCK_LOCATION]: {
            stock_location_id: stockLocation.id,
          },
          [Modules.FULFILLMENT]: {
            fulfillment_provider_id: "manual_manual",
          },
        })
        await linkSalesChannelsToStockLocationWorkflow(container).run({
          input: { id: stockLocation.id, add: [salesChannel.id] },
        })

        let [shippingProfile] = await fulfillment.listShippingProfiles({
          type: "default",
        })
        if (!shippingProfile) {
          const { result } = await createShippingProfilesWorkflow(container).run({
            input: {
              data: [{ name: "Removal test profile", type: "default" }],
            },
          })
          shippingProfile = result[0]
        }
        const fulfillmentSet = await fulfillment.createFulfillmentSets({
          name: "Incompatible removal fulfillment set",
          type: "shipping",
          service_zones: [{
            name: "United States",
            geo_zones: [{ country_code: "us", type: "country" }],
          }],
        })
        await link.create({
          [Modules.STOCK_LOCATION]: {
            stock_location_id: stockLocation.id,
          },
          [Modules.FULFILLMENT]: {
            fulfillment_set_id: fulfillmentSet.id,
          },
        })
        const { result: [shippingOption] } = await createShippingOptionsWorkflow(
          container
        ).run({
          input: [{
            name: "Removal test delivery",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: fulfillmentSet.service_zones[0].id,
            shipping_profile_id: shippingProfile.id,
            type: {
              label: "Removal test delivery",
              code: "removal-test-delivery",
            },
            prices: [{ amount: 500, currency_code: "usd" }],
            rules: [
              {
                attribute: "enabled_in_store",
                value: "true",
                operator: "eq",
              },
              {
                attribute: "is_return",
                value: "false",
                operator: "eq",
              },
            ],
            metadata: { type: "delivery" },
          } as any],
        })
        shippingOptionId = shippingOption.id

        const productInputs = [
          ["Incompatible product A", "incompatible-a", "REMOVE-A", 1000],
          ["Incompatible product B", "incompatible-b", "REMOVE-B", 1500],
          ["Compatible product", "compatible", "KEEP-C", 2000],
        ].map(([title, handle, sku, amount]) => ({
          title,
          handle: `removal-${handle}`,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [{ title: "Default", values: ["Default"] }],
          variants: [{
            title: "Default",
            sku,
            manage_inventory: false,
            options: { Default: "Default" },
            prices: [{ amount, currency_code: "usd" }],
          }],
          sales_channels: [{ id: salesChannel.id }],
        }))
        const { result: products } = await createProductsWorkflow(container).run({
          input: { products: productInputs as any },
        })
        incompatibleVariantAId = products[0].variants[0].id
        incompatibleVariantBId = products[1].variants[0].id
        compatibleVariantId = products[2].variants[0].id
        await shippingAvailability.createProductShippingOptions({
          product_id: products[2].id,
          shipping_option_id: shippingOption.id,
        })
      })

      const createCart = async (variantIds: string[]) => {
        const cart = await (getContainer().resolve(Modules.CART) as any)
          .createCarts({
            currency_code: "usd",
            region_id: regionId,
            sales_channel_id: salesChannelId,
          })
        const addressResponse = await api.post(
          `/store/carts/${cart.id}`,
          {
            email: "checkout@example.com",
            shipping_address: {
              first_name: "Checkout",
              last_name: "Customer",
              address_1: "1 Main Street",
              city: "New York",
              postal_code: "10001",
              country_code: "us",
            },
          },
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(addressResponse.status).toBe(200)

        for (const variantId of variantIds) {
          const response = await api.post(
            `/store/carts/${cart.id}/line-items`,
            { variant_id: variantId, quantity: 1 },
            { headers: storeHeaders, validateStatus: () => true }
          )
          expect(response.status).toBe(200)
        }
        const response = await api.get(
          `/store/carts/${cart.id}?fields=*items`,
          { headers: storeHeaders }
        )
        return response.data.cart as any
      }

      const removeItems = (
        cartId: string,
        lineItemIds: string[]
      ) => api.post(
        `/store/carts/${cartId}/shipping-availability/remove-incompatible-items`,
        {
          shipping_option_id: shippingOptionId,
          line_item_ids: lineItemIds,
        },
        { headers: storeHeaders, validateStatus: () => true }
      )

      it("blocks removing the only line item", async () => {
        const cart = await createCart([incompatibleVariantAId])
        const response = await removeItems(cart.id, [cart.items[0].id])

        expect(response.status).toBe(409)
        expect(response.data).toEqual({
          code: "SHIPPING_INCOMPATIBLE_ITEMS_KEEP_ONE",
          message:
            "Checkout must retain at least one cart item. Choose another shipping option or return to your cart.",
          details: {
            shipping_option_id: shippingOptionId,
            line_item_ids: [cart.items[0].id],
            item_count: 1,
            remaining_item_count: 0,
          },
        })
        const current = await api.get(`/store/carts/${cart.id}`, {
          headers: storeHeaders,
        })
        expect(current.data.cart.items).toHaveLength(1)
      })

      it("blocks a batch that covers all current line items", async () => {
        const cart = await createCart([
          incompatibleVariantAId,
          incompatibleVariantBId,
        ])
        const lineItemIds = cart.items.map((item: any) => item.id)
        const response = await removeItems(cart.id, lineItemIds)

        expect(response.status).toBe(409)
        expect(response.data.code).toBe(
          "SHIPPING_INCOMPATIBLE_ITEMS_KEEP_ONE"
        )
        const current = await api.get(`/store/carts/${cart.id}`, {
          headers: storeHeaders,
        })
        expect(current.data.cart.items).toHaveLength(2)
      })

      it("atomically removes a partial incompatible set and refreshes totals", async () => {
        const cart = await createCart([
          incompatibleVariantAId,
          compatibleVariantId,
        ])
        const incompatibleItem = cart.items.find(
          (item: any) => item.variant_id === incompatibleVariantAId
        )
        const response = await removeItems(cart.id, [incompatibleItem.id])

        expect(response.status).toBe(200)
        expect(response.data).toEqual({
          cart_id: cart.id,
          removed_line_item_ids: [incompatibleItem.id],
        })
        const current = await api.get(`/store/carts/${cart.id}`, {
          headers: storeHeaders,
        })
        expect(current.data.cart.items).toHaveLength(1)
        expect(current.data.cart.items[0].variant_id).toBe(compatibleVariantId)
        expect(current.data.cart.item_total).toBe(2000)
        const availability = await api.get(
          `/store/carts/${cart.id}/shipping-availability`,
          { headers: storeHeaders }
        )
        expect(availability.data.shipping_options.find(
          (option: any) => option.id === shippingOptionId
        )).toMatchObject({ is_compatible: true, incompatible_items: [] })
      })

      it("rejects a repeated direct API submission without deleting more", async () => {
        const cart = await createCart([
          incompatibleVariantAId,
          compatibleVariantId,
        ])
        const incompatibleItem = cart.items.find(
          (item: any) => item.variant_id === incompatibleVariantAId
        )
        expect((await removeItems(cart.id, [incompatibleItem.id])).status)
          .toBe(200)

        const repeated = await removeItems(cart.id, [incompatibleItem.id])
        expect(repeated.status).toBe(409)
        expect(repeated.data).toMatchObject({
          code: "SHIPPING_INCOMPATIBLE_ITEMS_CHANGED",
          details: { invalid_line_item_ids: [incompatibleItem.id] },
        })
        const current = await api.get(`/store/carts/${cart.id}`, {
          headers: storeHeaders,
        })
        expect(current.data.cart.items).toHaveLength(1)
        expect(current.data.cart.items[0].variant_id).toBe(compatibleVariantId)
      })

      it("serializes concurrent duplicate submissions", async () => {
        const cart = await createCart([
          incompatibleVariantAId,
          compatibleVariantId,
        ])
        const incompatibleItem = cart.items.find(
          (item: any) => item.variant_id === incompatibleVariantAId
        )

        const responses = await Promise.all([
          removeItems(cart.id, [incompatibleItem.id]),
          removeItems(cart.id, [incompatibleItem.id]),
        ])
        expect(responses.map((response) => response.status).sort())
          .toEqual([200, 409])
        expect(responses.find((response) => response.status === 409)?.data.code)
          .toBe("SHIPPING_INCOMPATIBLE_ITEMS_CHANGED")
        const current = await api.get(`/store/carts/${cart.id}`, {
          headers: storeHeaders,
        })
        expect(current.data.cart.items).toHaveLength(1)
        expect(current.data.cart.items[0].variant_id).toBe(compatibleVariantId)
      })
    })
  },
})
