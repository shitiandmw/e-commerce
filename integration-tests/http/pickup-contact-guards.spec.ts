import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createPaymentCollectionForCartWorkflow,
  createProductsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateShippingOptionsWorkflow,
} from "@medusajs/medusa/core-flows"
import { PICKUP_LOCATION_MODULE } from "../../src/modules/pickup-location"
import type PickupLocationModuleService from "../../src/modules/pickup-location/service"
import { SHIPPING_AVAILABILITY_MODULE } from "../../src/modules/shipping-availability"
import type ShippingAvailabilityModuleService from "../../src/modules/shipping-availability/service"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    describe.each(["hk", "mo"])(
      "pickup contact payment and completion guards for %s",
      (serviceZoneCountryCode) => {
      let cartId: string
      let paymentCollectionId: string
      let shippingAddressId: string
      let storeHeaders: Record<string, string>
      let deliveryOptionId: string
      let pickupOptionId: string
      let pickupLocationId: string
      let productId: string
      let salesChannelId: string
      let serviceZoneId: string
      let shippingProfileId: string

      const validContact = {
        first_name: "Ada",
        last_name: "Lovelace",
        phone: "+1 212 555 0100",
        email: "ada@example.com",
      }

      const deliveryAddress = {
        first_name: validContact.first_name,
        last_name: validContact.last_name,
        phone: validContact.phone,
        address_1: "99 Delivery Road",
        address_2: "Suite 8",
        city: "Central",
        province: "Test Province",
        postal_code: "000000",
        country_code: serviceZoneCountryCode,
      }

      async function selectDeliveryAndReadState() {
        const addressResponse = await api.post(
          `/store/carts/${cartId}`,
          {
            email: validContact.email,
            shipping_address: deliveryAddress,
          },
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(addressResponse.status).toBe(200)
        const shippingResponse = await api.post(
          `/store/carts/${cartId}/shipping-methods`,
          { option_id: deliveryOptionId },
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(shippingResponse.status).toBe(200)
        return readCartShippingState()
      }

      async function readCartShippingState() {
        const query = getContainer().resolve(
          ContainerRegistrationKeys.QUERY
        ) as any
        const { data: [cart] } = await query.graph({
          entity: "cart",
          fields: [
            "shipping_address.id",
            "shipping_address.first_name",
            "shipping_address.last_name",
            "shipping_address.phone",
            "shipping_address.address_1",
            "shipping_address.address_2",
            "shipping_address.city",
            "shipping_address.province",
            "shipping_address.postal_code",
            "shipping_address.country_code",
            "shipping_methods.id",
            "shipping_methods.shipping_option_id",
            "shipping_methods.name",
            "shipping_methods.amount",
          ],
          filters: { id: cartId },
        })

        return {
          shipping_address: cart.shipping_address,
          shipping_methods: [...cart.shipping_methods]
            .sort((left: any, right: any) => left.id.localeCompare(right.id)),
        }
      }

      beforeEach(async () => {
        const container = getContainer()
        const link = container.resolve(ContainerRegistrationKeys.LINK) as any
        const query = container.resolve(ContainerRegistrationKeys.QUERY) as any
        const fulfillment = container.resolve(Modules.FULFILLMENT) as any
        const pickupLocations = container.resolve(
          PICKUP_LOCATION_MODULE
        ) as PickupLocationModuleService
        const shippingAvailability = container.resolve(
          SHIPPING_AVAILABILITY_MODULE
        ) as ShippingAvailabilityModuleService

        const region = await (container.resolve(Modules.REGION) as any)
          .createRegions({
            name: "Pickup contact test region",
            currency_code: "usd",
            countries: [serviceZoneCountryCode],
          })
        const salesChannel = await (
          container.resolve(Modules.SALES_CHANNEL) as any
        ).createSalesChannels({ name: "Pickup contact test channel" })
        salesChannelId = salesChannel.id
        const { result: [publishableKey] } = await createApiKeysWorkflow(
          container
        ).run({
          input: {
            api_keys: [{
              title: "Pickup contact HTTP tests",
              type: "publishable",
              created_by: "",
            }],
          },
        })
        await linkSalesChannelsToApiKeyWorkflow(container).run({
          input: { id: publishableKey.id, add: [salesChannel.id] },
        })
        storeHeaders = { "x-publishable-api-key": publishableKey.token }

        const { result: [stockLocation] } = await createStockLocationsWorkflow(
          container
        ).run({
          input: {
            locations: [{
              name: "Pickup contact stock location",
              address: {
                address_1: "1 Main Street",
                city: "New York",
                country_code: serviceZoneCountryCode.toUpperCase(),
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
          input: {
            id: stockLocation.id,
            add: [salesChannel.id],
          },
        })
        let [shippingProfile] = await fulfillment.listShippingProfiles({
          type: "default",
        })
        if (!shippingProfile) {
          const { result } = await createShippingProfilesWorkflow(container).run({
            input: {
              data: [{ name: "Pickup contact profile", type: "default" }],
            },
          })
          shippingProfile = result[0]
        }
        const fulfillmentSet = await fulfillment.createFulfillmentSets({
          name: "Pickup contact fulfillment set",
          type: "shipping",
          service_zones: [{
            name: "United States",
            geo_zones: [{
              country_code: serviceZoneCountryCode,
              type: "country",
            }],
          }],
        })
        serviceZoneId = fulfillmentSet.service_zones[0].id
        shippingProfileId = shippingProfile.id
        await link.create({
          [Modules.STOCK_LOCATION]: {
            stock_location_id: stockLocation.id,
          },
          [Modules.FULFILLMENT]: {
            fulfillment_set_id: fulfillmentSet.id,
          },
        })
        const { result: [pickupOption] } = await createShippingOptionsWorkflow(
          container
        ).run({
          input: [{
            name: "Pickup contact option",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: fulfillmentSet.service_zones[0].id,
            shipping_profile_id: shippingProfile.id,
            type: {
              label: "Pickup contact option",
              code: "pickup-contact-option",
            },
            prices: [{ amount: 0, currency_code: "usd" }],
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
            metadata: { type: "pickup" },
          } as any],
        })
        await updateShippingOptionsWorkflow(container).run({
          input: [{
            id: pickupOption.id,
            metadata: { type: "pickup" },
          } as any],
        })
        pickupOptionId = pickupOption.id
        const { result: [deliveryOption] } = await createShippingOptionsWorkflow(
          container
        ).run({
          input: [{
            name: "Pickup contact delivery option",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: serviceZoneId,
            shipping_profile_id: shippingProfileId,
            type: {
              label: "Pickup contact delivery option",
              code: `pickup-contact-delivery-${serviceZoneCountryCode}`,
            },
            prices: [{ amount: 100, currency_code: "usd" }],
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
        deliveryOptionId = deliveryOption.id
        const pickupLocation = await pickupLocations.createPickupLocations({
          name: "Pickup contact location",
          address: "1 Main Street",
          hours: "10:00-18:00",
          is_enabled: true,
        })
        pickupLocationId = pickupLocation.id
        await shippingAvailability.createShippingOptionPickupLocations({
          shipping_option_id: pickupOption.id,
          pickup_location_id: pickupLocation.id,
        })

        const { result: [product] } = await createProductsWorkflow(container)
          .run({
            input: {
              products: [{
                title: "Pickup contact product",
                handle: "pickup-contact-product",
                status: ProductStatus.PUBLISHED,
                shipping_profile_id: shippingProfile.id,
                options: [{ title: "Default", values: ["Default"] }],
                variants: [{
                  title: "Default",
                  sku: "PICKUP-CONTACT-DEFAULT",
                  manage_inventory: false,
                  options: { Default: "Default" },
                  prices: [{ amount: 1000, currency_code: "usd" }],
                }],
                sales_channels: [{ id: salesChannel.id }],
              }],
            },
          })
        productId = product.id
        await shippingAvailability.createProductShippingOptions({
          product_id: product.id,
          shipping_option_id: pickupOption.id,
        })
        await shippingAvailability.createProductShippingOptions({
          product_id: product.id,
          shipping_option_id: deliveryOptionId,
        })

        const cart = await (container.resolve(Modules.CART) as any).createCarts({
          currency_code: "usd",
          region_id: region.id,
          sales_channel_id: salesChannel.id,
        })
        cartId = cart.id
        const lineItemResponse = await api.post(
          `/store/carts/${cartId}/line-items`,
          { variant_id: product.variants[0].id, quantity: 1 },
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(lineItemResponse.status).toBe(200)
        const addressResponse = await api.post(
          `/store/carts/${cartId}`,
          {
            email: validContact.email,
            shipping_address: {
              first_name: validContact.first_name,
              last_name: validContact.last_name,
              phone: validContact.phone,
            },
          },
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(addressResponse.status).toBe(200)
        const availabilityResponse = await api.get(
          `/store/carts/${cartId}/shipping-availability`,
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(availabilityResponse.status).toBe(200)
        expect(
          availabilityResponse.data.shipping_options.find(
            (option: any) => option.id === pickupOption.id
          )
        ).toMatchObject({
          is_pickup: true,
          core_available: true,
          is_compatible: true,
          pickup_location_valid: true,
        })
        const shippingResponse = await api.post(
          `/store/carts/${cartId}/shipping-methods`,
          { option_id: pickupOption.id },
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(shippingResponse.status).toBe(200)

        const preparedCartResponse = await api.get(
          `/store/carts/${cartId}?fields=shipping_address.*`,
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(preparedCartResponse.status).toBe(200)
        expect(preparedCartResponse.data.cart.shipping_address).toMatchObject({
          first_name: validContact.first_name,
          last_name: validContact.last_name,
          phone: validContact.phone,
          address_1: "Pickup Order",
          country_code: serviceZoneCountryCode,
          city: null,
          province: null,
          postal_code: null,
        })

        const { data: carts } = await query.graph({
          entity: "cart",
          fields: ["shipping_address.id"],
          filters: { id: cartId },
        })
        shippingAddressId = carts[0].shipping_address.id
        const { result: paymentCollection } = await
          createPaymentCollectionForCartWorkflow(container).run({
            input: { cart_id: cartId },
          })
        paymentCollectionId = paymentCollection.id
      })

      it("uses the service zone address and preserves the display-only pickup snapshot through completion", async () => {
        const paymentResponse = await api.post(
          `/store/payment-collections/${paymentCollectionId}/payment-sessions`,
          { provider_id: "pp_system_default" },
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(paymentResponse.status).toBe(200)

        const completeResponse = await api.post(
          `/store/carts/${cartId}/complete`,
          {},
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(completeResponse.status).toBe(200)
        expect(completeResponse.data.type).toBe("order")
        const query = getContainer().resolve(
          ContainerRegistrationKeys.QUERY
        ) as any
        const { data: orders } = await query.graph({
          entity: "order",
          fields: ["metadata", "shipping_methods.metadata"],
          filters: { id: completeResponse.data.order.id },
        })
        const snapshot =
          orders[0].metadata?.shipping_delivery_snapshot ??
          orders[0].shipping_methods?.[0]?.metadata
            ?.shipping_delivery_snapshot
        expect(snapshot)
          .toMatchObject({
            shipping_option: { type: "pickup" },
            pickup_location: {
              name: "Pickup contact location",
              address: "1 Main Street",
              hours: "10:00-18:00",
              country_code: null,
              city: null,
              province: null,
              postal_code: null,
            },
          })
      })

      it("keeps the delivery address and method when the pickup location is disabled", async () => {
        const originalState = await selectDeliveryAndReadState()
        const pickupLocations = getContainer().resolve(
          PICKUP_LOCATION_MODULE
        ) as PickupLocationModuleService
        await pickupLocations.updatePickupLocations({
          id: pickupLocationId,
          is_enabled: false,
        })

        const response = await api.post(
          `/store/carts/${cartId}/shipping-methods`,
          { option_id: pickupOptionId },
          { headers: storeHeaders, validateStatus: () => true }
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe("PICKUP_LOCATION_DISABLED")
        expect(await readCartShippingState()).toEqual(originalState)
      })

      it("keeps the delivery address and method when a cart item is incompatible", async () => {
        const container = getContainer()
        const shippingAvailability = container.resolve(
          SHIPPING_AVAILABILITY_MODULE
        ) as ShippingAvailabilityModuleService
        const { result: [incompatibleProduct] } = await createProductsWorkflow(
          container
        ).run({
          input: {
            products: [{
              title: "Pickup incompatible product",
              handle: `pickup-incompatible-${serviceZoneCountryCode}`,
              status: ProductStatus.PUBLISHED,
              shipping_profile_id: shippingProfileId,
              options: [{ title: "Default", values: ["Default"] }],
              variants: [{
                title: "Default",
                sku: `PICKUP-INCOMPATIBLE-${serviceZoneCountryCode}`,
                manage_inventory: false,
                options: { Default: "Default" },
                prices: [{ amount: 500, currency_code: "usd" }],
              }],
              sales_channels: [{ id: salesChannelId }],
            }],
          },
        })
        await shippingAvailability.createProductShippingOptions({
          product_id: incompatibleProduct.id,
          shipping_option_id: deliveryOptionId,
        })
        const lineItemResponse = await api.post(
          `/store/carts/${cartId}/line-items`,
          { variant_id: incompatibleProduct.variants[0].id, quantity: 1 },
          { headers: storeHeaders, validateStatus: () => true }
        )
        expect(lineItemResponse.status).toBe(200)
        const originalState = await selectDeliveryAndReadState()

        const response = await api.post(
          `/store/carts/${cartId}/shipping-methods`,
          { option_id: pickupOptionId },
          { headers: storeHeaders, validateStatus: () => true }
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe("SHIPPING_OPTION_INCOMPATIBLE")
        expect(await readCartShippingState()).toEqual(originalState)
      })

      it("compensates the address when core availability rejects the pickup option", async () => {
        const container = getContainer()
        const pickupLocations = container.resolve(
          PICKUP_LOCATION_MODULE
        ) as PickupLocationModuleService
        const shippingAvailability = container.resolve(
          SHIPPING_AVAILABILITY_MODULE
        ) as ShippingAvailabilityModuleService
        const { result: [unavailableOption] } = await
          createShippingOptionsWorkflow(container).run({
            input: [{
              name: "Core unavailable pickup option",
              price_type: "flat",
              provider_id: "manual_manual",
              service_zone_id: serviceZoneId,
              shipping_profile_id: shippingProfileId,
              type: {
                label: "Core unavailable pickup option",
                code: `core-unavailable-pickup-${serviceZoneCountryCode}`,
              },
              prices: [{ amount: 0, currency_code: "usd" }],
              rules: [
                {
                  attribute: "enabled_in_store",
                  value: "false",
                  operator: "eq",
                },
                {
                  attribute: "is_return",
                  value: "false",
                  operator: "eq",
                },
              ],
              metadata: { type: "pickup" },
            } as any],
          })
        await updateShippingOptionsWorkflow(container).run({
          input: [{
            id: unavailableOption.id,
            metadata: { type: "pickup" },
          } as any],
        })
        const unavailableLocation = await
          pickupLocations.createPickupLocations({
            name: "Core unavailable pickup location",
            address: "Display only address",
            is_enabled: true,
          })
        await shippingAvailability.createShippingOptionPickupLocations({
          shipping_option_id: unavailableOption.id,
          pickup_location_id: unavailableLocation.id,
        })
        await shippingAvailability.createProductShippingOptions({
          product_id: productId,
          shipping_option_id: unavailableOption.id,
        })
        const originalState = await selectDeliveryAndReadState()

        const response = await api.post(
          `/store/carts/${cartId}/shipping-methods`,
          { option_id: unavailableOption.id },
          { headers: storeHeaders, validateStatus: () => true }
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe("SHIPPING_OPTION_UNAVAILABLE")
        expect(await readCartShippingState()).toEqual(originalState)
      })

      it("blocks payment session creation and completion for empty or whitespace pickup contacts", async () => {
        const cartService = getContainer().resolve(Modules.CART) as any
        const pgConnection = getContainer().resolve(
          ContainerRegistrationKeys.PG_CONNECTION
        ) as any
        const cases = [
          ["shipping_address.first_name", "first_name", ""],
          ["shipping_address.first_name", "first_name", "   "],
          ["shipping_address.last_name", "last_name", ""],
          ["shipping_address.last_name", "last_name", "   "],
          ["shipping_address.phone", "phone", ""],
          ["shipping_address.phone", "phone", "   "],
          ["email", "email", ""],
          ["email", "email", "   "],
        ] as const

        for (const [fieldPath, field, value] of cases) {
          await cartService.updateCarts({
            id: cartId,
            email: validContact.email,
          })
          await cartService.updateAddresses({
            id: shippingAddressId,
            first_name: validContact.first_name,
            last_name: validContact.last_name,
            phone: validContact.phone,
          })
          if (field === "email") {
            await pgConnection.raw(
              'update "cart" set "email" = ? where "id" = ?',
              [value || null, cartId]
            )
          } else {
            await cartService.updateAddresses({
              id: shippingAddressId,
              [field]: value,
            })
          }
          const { data: currentCarts } = await (
            getContainer().resolve(ContainerRegistrationKeys.QUERY) as any
          ).graph({
            entity: "cart",
            fields: [
              "email",
              "shipping_address.first_name",
              "shipping_address.last_name",
              "shipping_address.phone",
            ],
            filters: { id: cartId },
          })
          const currentValue = field === "email"
            ? currentCarts[0].email
            : currentCarts[0].shipping_address[field]
          expect(currentValue).toBe(
            field === "email" && !value ? null : value
          )

          const paymentResponse = await api.post(
            `/store/payment-collections/${paymentCollectionId}/payment-sessions`,
            { provider_id: "pp_system_default" },
            { headers: storeHeaders, validateStatus: () => true }
          )
          expect(paymentResponse.status).toBe(409)
          expect(paymentResponse.data).toEqual({
            code: "PICKUP_CONTACT_INVALID",
            message:
              "A first name, last name, phone number, and valid email are required for pickup.",
            details: {
              shipping_option_id: expect.any(String),
              missing_fields: [fieldPath],
              invalid_fields: [],
            },
          })

          const completeResponse = await api.post(
            `/store/carts/${cartId}/complete`,
            {},
            { headers: storeHeaders, validateStatus: () => true }
          )
          expect(completeResponse.status).toBe(409)
          expect(completeResponse.data.code).toBe("PICKUP_CONTACT_INVALID")
          expect(completeResponse.data.details.missing_fields).toEqual([
            fieldPath,
          ])
        }
      })
      }
    )
  },
})
