import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import { SHIPPING_AVAILABILITY_MODULE } from ".."
import type ShippingAvailabilityModuleService from "../service"

jest.setTimeout(60_000)

moduleIntegrationTestRunner<ShippingAvailabilityModuleService>({
  moduleName: SHIPPING_AVAILABILITY_MODULE,
  resolve: "./src/modules/shipping-availability",
  testSuite: ({ service, MikroOrmWrapper }) => {
    describe("shipping availability module", () => {
      it("stores idempotent product mappings and enforces unique pairs", async () => {
        const link = await service.createProductShippingOptions({
          product_id: "prod_test",
          shipping_option_id: "so_test",
        })
        expect(link.product_id).toBe("prod_test")

        await expect(
          service.createProductShippingOptions({
            product_id: "prod_test",
            shipping_option_id: "so_test",
          })
        ).rejects.toThrow()

        const links = await service.listProductShippingOptions({
          product_id: "prod_test",
        })
        expect(links).toHaveLength(1)
      })

      it("enforces one pickup location per option and one option per location", async () => {
        await service.createShippingOptionPickupLocations({
          shipping_option_id: "so_pickup_a",
          pickup_location_id: "loc_a",
        })

        await expect(
          service.createShippingOptionPickupLocations({
            shipping_option_id: "so_pickup_a",
            pickup_location_id: "loc_b",
          })
        ).rejects.toThrow()
        await expect(
          service.createShippingOptionPickupLocations({
            shipping_option_id: "so_pickup_b",
            pickup_location_id: "loc_a",
          })
        ).rejects.toThrow()
      })

      it("replaces product options idempotently and keeps an exact non-empty set", async () => {
        await service.replaceProductShippingOptions("prod_replace", ["so_a", "so_b"])
        await service.replaceProductShippingOptions("prod_replace", ["so_b", "so_c", "so_c"])

        const links = await service.listProductShippingOptions({
          product_id: "prod_replace",
        })
        expect(links.map((link) => link.shipping_option_id).sort())
          .toEqual(["so_b", "so_c"])
        await expect(
          service.replaceProductShippingOptions("prod_replace", [])
        ).rejects.toMatchObject({ shipping_code: "SHIPPING_OPTION_REQUIRED" })
      })

      it("rolls back the replacement when creation fails", async () => {
        await service.replaceProductShippingOptions("prod_rollback", ["so_old"])
        const manager = MikroOrmWrapper.getManager()
        await manager.execute(`
          alter table "product_shipping_option"
          add constraint "product_shipping_option_reject_test_value"
          check ("shipping_option_id" <> 'so_new')
        `)
        try {
          await expect(
            service.replaceProductShippingOptions("prod_rollback", ["so_new"])
          ).rejects.toThrow()
        } finally {
          await manager.execute(`
            alter table "product_shipping_option"
            drop constraint "product_shipping_option_reject_test_value"
          `)
        }

        const links = await service.listProductShippingOptions({
          product_id: "prod_rollback",
        })
        expect(links.map((link) => link.shipping_option_id)).toEqual(["so_old"])
      })

      it("serializes concurrent replacements without producing a mixed set", async () => {
        await service.replaceProductShippingOptions("prod_concurrent", ["so_initial"])
        const requestedSets = [
          ["so_a", "so_b"],
          ["so_c", "so_d"],
        ]
        await Promise.all(
          requestedSets.map((ids) =>
            service.replaceProductShippingOptions("prod_concurrent", ids)
          )
        )

        const links = await service.listProductShippingOptions({
          product_id: "prod_concurrent",
        })
        const actual = links.map((link) => link.shipping_option_id).sort()
        expect(requestedSets.map((ids) => [...ids].sort())).toContainEqual(actual)
      })
    })
  },
})
