import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
} from "@medusajs/medusa/core-flows"
import { sign } from "jsonwebtoken"
import { PICKUP_LOCATION_MODULE } from "../../src/modules/pickup-location"
import type PickupLocationModuleService from "../../src/modules/pickup-location/service"
import { SHIPPING_AVAILABILITY_MODULE } from "../../src/modules/shipping-availability"
import type ShippingAvailabilityModuleService from "../../src/modules/shipping-availability/service"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: { JWT_SECRET: "supersecret" },
  testSuite: ({ api, getContainer }) => {
    describe("atomic shipping option configuration", () => {
      let adminHeaders: Record<string, string>
      let optionId: string
      let occupiedOptionId: string
      let matchingLocationId: string
      let alternateLocationId: string
      let mismatchedLocationId: string
      let shippingAvailability: ShippingAvailabilityModuleService

      const snapshotOption = async (id: string) => {
        const optionResponse = await api.get(
          `/admin/shipping-options/${id}`,
          { headers: adminHeaders }
        )
        const bindings = await shippingAvailability
          .listShippingOptionPickupLocations({ shipping_option_id: id })
        const option = optionResponse.data.shipping_option
        return {
          name: option.name,
          metadata: option.metadata,
          prices: (option.prices ?? [])
            .map((price: any) => ({
              amount: price.amount,
              currency_code: price.currency_code ?? null,
              region_id: price.region_id ?? null,
            }))
            .sort((a: any, b: any) =>
              JSON.stringify(a).localeCompare(JSON.stringify(b))
            ),
          pickup_location_id: bindings[0]?.pickup_location_id ?? null,
        }
      }

      const updateConfiguration = (
        id: string,
        metadataMarker: string,
        pickupLocationId: string,
        amount = 0
      ) => api.post(
        `/admin/shipping-options/${id}/configuration`,
        {
          shipping_option: {
            name: `Pickup ${metadataMarker}`,
            price_type: "flat",
            metadata: { type: "pickup", marker: metadataMarker },
            prices: [{ amount, currency_code: "usd" }],
          },
          pickup_location_id: pickupLocationId,
        },
        { headers: adminHeaders, validateStatus: () => true }
      )

      const updatePickupLocation = (
        id: string,
        update: Record<string, unknown>
      ) => api.post(
        `/admin/pickup-locations/${id}`,
        update,
        { headers: adminHeaders, validateStatus: () => true }
      )

      const deletePickupLocation = (id: string) => api.delete(
        `/admin/pickup-locations/${id}`,
        { headers: adminHeaders, validateStatus: () => true }
      )

      const getLocationAndBinding = async (pickupLocationId: string) => {
        const pickupLocations = getContainer().resolve(
          PICKUP_LOCATION_MODULE
        ) as PickupLocationModuleService
        const [location] = await pickupLocations.listPickupLocations({
          id: [pickupLocationId],
        } as any)
        const [binding] = await shippingAvailability
          .listShippingOptionPickupLocations({ shipping_option_id: optionId })
        return { location: location ?? null, binding: binding ?? null }
      }

      beforeEach(async () => {
        const container = getContainer()
        const config = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE) as any
        const link = container.resolve(ContainerRegistrationKeys.LINK) as any
        const fulfillment = container.resolve(Modules.FULFILLMENT) as any
        const pickupLocations = container.resolve(
          PICKUP_LOCATION_MODULE
        ) as PickupLocationModuleService
        shippingAvailability = container.resolve(
          SHIPPING_AVAILABILITY_MODULE
        ) as ShippingAvailabilityModuleService
        adminHeaders = {
          authorization: `Bearer ${sign(
            {
              actor_id: "user_shipping_configuration_test",
              actor_type: "user",
              auth_identity_id: "auth_shipping_configuration_test",
              app_metadata: {},
              user_metadata: {},
            },
            config.projectConfig.http.jwtSecret
          )}`,
        }

        const { result: [stockLocation] } = await createStockLocationsWorkflow(
          container
        ).run({
          input: {
            locations: [{
              name: "Atomic shipping test location",
              address: {
                address_1: "1 Test Street",
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

        let [shippingProfile] = await fulfillment.listShippingProfiles({
          type: "default",
        })
        if (!shippingProfile) {
          const { result } = await createShippingProfilesWorkflow(container).run({
            input: {
              data: [{ name: "Atomic shipping profile", type: "default" }],
            },
          })
          shippingProfile = result[0]
        }
        const fulfillmentSet = await fulfillment.createFulfillmentSets({
          name: "Atomic shipping fulfillment set",
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
        const { result: options } = await createShippingOptionsWorkflow(
          container
        ).run({
          input: [
            {
              name: "Original delivery",
              price_type: "flat",
              provider_id: "manual_manual",
              service_zone_id: fulfillmentSet.service_zones[0].id,
              shipping_profile_id: shippingProfile.id,
              type: {
                label: "Original delivery",
                code: "atomic-original-delivery",
              },
              prices: [{ amount: 700, currency_code: "usd" }],
              metadata: { type: "delivery", marker: "original" },
            } as any,
            {
              name: "Occupied option",
              price_type: "flat",
              provider_id: "manual_manual",
              service_zone_id: fulfillmentSet.service_zones[0].id,
              shipping_profile_id: shippingProfile.id,
              type: {
                label: "Occupied option",
                code: "atomic-occupied-option",
              },
              prices: [{ amount: 0, currency_code: "usd" }],
              metadata: { type: "pickup", marker: "occupied" },
            } as any,
          ],
        })
        optionId = options[0].id
        occupiedOptionId = options[1].id

        const matchingLocation = await pickupLocations.createPickupLocations({
          name: "Matching pickup",
          address: "1 Main Street",
          country_code: "us",
          city: "New York",
          province: "NY",
          postal_code: "10001",
          is_enabled: true,
        })
        const alternateLocation = await pickupLocations.createPickupLocations({
          name: "Alternate pickup",
          address: "2 Main Street",
          is_enabled: true,
        })
        const mismatchedLocation = await pickupLocations.createPickupLocations({
          name: "Mismatched pickup",
          address: "1 Queen Street",
          country_code: "ca",
          city: "Toronto",
          province: "ON",
          postal_code: "M5H 2N2",
          is_enabled: true,
        })
        matchingLocationId = matchingLocation.id
        alternateLocationId = alternateLocation.id
        mismatchedLocationId = mismatchedLocation.id
      })

      it("creates a pickup location without structured address fields", async () => {
        const response = await api.post(
          "/admin/pickup-locations",
          {
            name: "Display-only pickup",
            address: "Shop 8, Ground Floor",
            phone: "+852 1234 5678",
            is_enabled: true,
          },
          { headers: adminHeaders, validateStatus: () => true }
        )

        expect(response.status).toBe(200)
        expect(response.data.pickup_location).toMatchObject({
          name: "Display-only pickup",
          address: "Shop 8, Ground Floor",
          country_code: null,
          city: null,
          province: null,
          postal_code: null,
        })
      })

      it("allows an enabled pickup location from any service zone", async () => {
        const response = await updateConfiguration(
          optionId,
          "cross-zone",
          mismatchedLocationId
        )

        expect(response.status).toBe(200)
        await expect(snapshotOption(optionId)).resolves.toMatchObject({
          metadata: expect.objectContaining({ marker: "cross-zone" }),
          pickup_location_id: mismatchedLocationId,
        })
      })

      it("allows a pickup location with all structured fields omitted", async () => {
        const response = await updateConfiguration(
          optionId,
          "unstructured",
          alternateLocationId
        )

        expect(response.status).toBe(200)
        await expect(snapshotOption(optionId)).resolves.toMatchObject({
          metadata: expect.objectContaining({ marker: "unstructured" }),
          pickup_location_id: alternateLocationId,
        })
      })

      it("keeps metadata, prices, and binding unchanged when the location is occupied", async () => {
        await shippingAvailability.createShippingOptionPickupLocations({
          shipping_option_id: occupiedOptionId,
          pickup_location_id: matchingLocationId,
        })
        const before = await snapshotOption(optionId)
        const response = await updateConfiguration(
          optionId,
          "occupied",
          matchingLocationId
        )

        expect(response.status).toBe(409)
        expect(response.data.code).toBe("PICKUP_LOCATION_ALREADY_BOUND")
        await expect(snapshotOption(optionId)).resolves.toEqual(before)
      })

      it("returns pickup location occupancy for the Admin selector", async () => {
        await shippingAvailability.createShippingOptionPickupLocations({
          shipping_option_id: occupiedOptionId,
          pickup_location_id: matchingLocationId,
        })

        const response = await api.get(
          "/admin/pickup-locations?limit=100",
          { headers: adminHeaders }
        )
        expect(response.status).toBe(200)
        expect(response.data.pickup_locations.find(
          (location: any) => location.id === matchingLocationId
        )).toMatchObject({ shipping_option_id: occupiedOptionId })
        expect(response.data.pickup_locations.find(
          (location: any) => location.id === alternateLocationId
        )).toMatchObject({ shipping_option_id: null })
      })

      it("compensates option data and prices when the binding write fails", async () => {
        const initialResponse = await updateConfiguration(
          optionId,
          "initial",
          matchingLocationId
        )
        expect(initialResponse.status).toBe(200)
        const before = await snapshotOption(optionId)
        const updateBinding = jest
          .spyOn(shippingAvailability, "updateShippingOptionPickupLocations")
          .mockRejectedValueOnce(new Error("injected binding write failure"))
        try {
          const response = await updateConfiguration(
            optionId,
            "failed-write",
            alternateLocationId,
            50
          )
          expect(response.status).toBeGreaterThanOrEqual(400)
        } finally {
          updateBinding.mockRestore()
        }

        await expect(snapshotOption(optionId)).resolves.toEqual(before)
      })

      it("serializes concurrent edits without mixing option data and binding", async () => {
        const [first, second] = await Promise.all([
          updateConfiguration(optionId, "first", matchingLocationId),
          updateConfiguration(optionId, "second", alternateLocationId),
        ])
        expect(first.status).toBe(200)
        expect(second.status).toBe(200)

        const current = await snapshotOption(optionId)
        expect([
          {
            marker: "first",
            name: "Pickup first",
            pickup_location_id: matchingLocationId,
          },
          {
            marker: "second",
            name: "Pickup second",
            pickup_location_id: alternateLocationId,
          },
        ]).toContainEqual({
          marker: current.metadata?.marker,
          name: current.name,
          pickup_location_id: current.pickup_location_id,
        })
      })

      it("serializes binding against disabling its pickup location", async () => {
        const [configurationResponse, disableResponse] = await Promise.all([
          updateConfiguration(optionId, "disable-race", matchingLocationId),
          updatePickupLocation(matchingLocationId, { is_enabled: false }),
        ])

        expect([
          configurationResponse.status,
          disableResponse.status,
        ].sort()).toEqual([200, 409])
        const { location, binding } = await getLocationAndBinding(
          matchingLocationId
        )
        expect(location).not.toBeNull()
        if (binding) {
          expect(binding.pickup_location_id).toBe(matchingLocationId)
          expect(location?.is_enabled).toBe(true)
        } else {
          expect(location?.is_enabled).toBe(false)
        }
      })

      it("allows structured address edits without invalidating an existing binding", async () => {
        const [configurationResponse, updateResponse] = await Promise.all([
          updateConfiguration(optionId, "zone-race", matchingLocationId),
          updatePickupLocation(matchingLocationId, {
            address: "1 Queen Street",
            country_code: "ca",
            city: "Toronto",
            province: "ON",
            postal_code: "M5H 2N2",
          }),
        ])

        expect(configurationResponse.status).toBe(200)
        expect(updateResponse.status).toBe(200)
        const { location, binding } = await getLocationAndBinding(
          matchingLocationId
        )
        expect(location).not.toBeNull()
        expect(binding?.pickup_location_id).toBe(matchingLocationId)
        expect(location?.country_code).toBe("ca")
      })

      it("serializes binding against deleting its pickup location", async () => {
        const [configurationResponse, deleteResponse] = await Promise.all([
          updateConfiguration(optionId, "delete-race", matchingLocationId),
          deletePickupLocation(matchingLocationId),
        ])

        expect([
          configurationResponse.status,
          deleteResponse.status,
        ].sort()).toEqual([200, 409])
        const { location, binding } = await getLocationAndBinding(
          matchingLocationId
        )
        if (binding) {
          expect(binding.pickup_location_id).toBe(matchingLocationId)
          expect(location).not.toBeNull()
        } else {
          expect(location).toBeNull()
        }
      })
    })
  },
})
