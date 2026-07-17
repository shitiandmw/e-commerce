import {
  buildShippingDeliverySnapshot,
  deriveShippingOptionServiceZoneAddress,
  diffProductShippingOptionLinks,
  getIncompatibleCartItems,
  hasValidDeliveryAddress,
  normalizeShippingOptionIds,
  validateIncompatibleItemRemoval,
  validatePickupContact,
  type ShippingOptionCompatibility,
} from "../lib/shipping-availability"
import { parseBackfillArgs } from "../scripts/backfill-product-shipping-options"

describe("shipping availability", () => {
  it("normalizes option IDs and computes an idempotent sync", () => {
    expect(normalizeShippingOptionIds([" so_a ", "so_a", "", "so_b"]))
      .toEqual(["so_a", "so_b"])

    const existing = [
      { id: "link_a", shipping_option_id: "so_a" },
      { id: "link_b", shipping_option_id: "so_b" },
    ]
    expect(diffProductShippingOptionLinks(existing, ["so_a", "so_b"]))
      .toEqual({ ids: ["so_a", "so_b"], toDelete: [], toCreate: [] })
    expect(diffProductShippingOptionLinks(existing, ["so_b", "so_c"]))
      .toEqual({
        ids: ["so_b", "so_c"],
        toDelete: [existing[0]],
        toCreate: ["so_c"],
      })
  })

  it("treats missing product mappings as incompatible", () => {
    const items = [
      { id: "item_a", product_id: "prod_a", product_title: "A", quantity: 1 },
      { id: "item_b", product_id: "prod_b", product_title: "B", quantity: 2 },
    ]
    const allowed = new Map([["prod_a", new Set(["so_pickup"])]])

    expect(getIncompatibleCartItems(items, allowed, "so_pickup"))
      .toEqual([
        {
          line_item_id: "item_b",
          product_id: "prod_b",
          title: "B",
          thumbnail: null,
          quantity: 2,
        },
      ])
  })

  it.each([
    ["one item", ["item_a"], ["item_a"]],
    ["multiple items", ["item_a", "item_b"], ["item_a", "item_b"]],
  ])("blocks removing every cart line for %s", (_name, cartIds, removeIds) => {
    const availability = {
      cart: { items: cartIds.map((id) => ({ id })) },
      shipping_options: [{
        id: "so_pickup",
        incompatible_items: removeIds.map((line_item_id) => ({ line_item_id })),
      }],
    } as any

    expect(() => validateIncompatibleItemRemoval(
      availability,
      "so_pickup",
      removeIds
    )).toThrow(expect.objectContaining({
      shipping_code: "SHIPPING_INCOMPATIBLE_ITEMS_KEEP_ONE",
      details: expect.objectContaining({ remaining_item_count: 0 }),
    }))
  })

  it("allows an atomic incompatible subset and rejects a stale repeat", () => {
    const availability = {
      cart: { items: [{ id: "item_a" }, { id: "item_b" }] },
      shipping_options: [{
        id: "so_pickup",
        incompatible_items: [{ line_item_id: "item_a" }],
      }],
    } as any

    expect(validateIncompatibleItemRemoval(
      availability,
      "so_pickup",
      ["item_a", "item_a"]
    )).toEqual(["item_a"])

    expect(() => validateIncompatibleItemRemoval(
      {
        ...availability,
        cart: { items: [{ id: "item_b" }] },
        shipping_options: [{ id: "so_pickup", incompatible_items: [] }],
      } as any,
      "so_pickup",
      ["item_a"]
    )).toThrow(expect.objectContaining({
      shipping_code: "SHIPPING_INCOMPATIBLE_ITEMS_CHANGED",
      details: expect.objectContaining({ invalid_line_item_ids: ["item_a"] }),
    }))
  })

  it("builds an immutable pickup snapshot from the selected option", () => {
    const option = {
      id: "so_pickup",
      name: "Hong Kong pickup",
      amount: 0,
      is_pickup: true,
      core_available: true,
      is_compatible: true,
      pickup_location_valid: true,
      pickup_location: {
        id: "loc_hk",
        name: "Central",
        address: "1 Queen's Road",
        country_code: "hk",
        city: "Hong Kong",
        province: null,
        postal_code: "000000",
        phone: null,
        hours: "10:00-18:00",
        note: null,
      },
      incompatible_items: [],
      unavailable_reason: null,
    } satisfies ShippingOptionCompatibility

    expect(buildShippingDeliverySnapshot(option, "2026-07-16T00:00:00.000Z"))
      .toEqual({
        version: 1,
        captured_at: "2026-07-16T00:00:00.000Z",
        shipping_option: {
          id: "so_pickup",
          name: "Hong Kong pickup",
          type: "pickup",
        },
        pickup_location: option.pickup_location,
      })
  })

  it("parses parameterized dry-run backfill arguments", () => {
    expect(parseBackfillArgs(["--option-ids=so_mail,so_hk,so_mo", "--dry-run"]))
      .toEqual({
        optionIds: ["so_mail", "so_hk", "so_mo"],
        dryRun: true,
      })
  })

  it("requires the core delivery address fields", () => {
    expect(hasValidDeliveryAddress({
      first_name: "Ada",
      last_name: "Lovelace",
      address_1: "1 Main Street",
      city: "London",
      country_code: "gb",
    })).toBe(true)
    expect(hasValidDeliveryAddress({
      first_name: "Ada",
      last_name: "",
      address_1: "1 Main Street",
      city: "London",
      country_code: "gb",
    })).toBe(false)
  })

  it.each([
    ["shipping_address.first_name", { first_name: "", last_name: "Lovelace", phone: "123" }, "ada@example.com"],
    ["shipping_address.first_name", { first_name: "   ", last_name: "Lovelace", phone: "123" }, "ada@example.com"],
    ["shipping_address.last_name", { first_name: "Ada", last_name: "", phone: "123" }, "ada@example.com"],
    ["shipping_address.last_name", { first_name: "Ada", last_name: "   ", phone: "123" }, "ada@example.com"],
    ["shipping_address.phone", { first_name: "Ada", last_name: "Lovelace", phone: "" }, "ada@example.com"],
    ["shipping_address.phone", { first_name: "Ada", last_name: "Lovelace", phone: "   " }, "ada@example.com"],
    ["email", { first_name: "Ada", last_name: "Lovelace", phone: "123" }, ""],
    ["email", { first_name: "Ada", last_name: "Lovelace", phone: "123" }, "   "],
  ])("reports missing pickup contact field %s", (field, address, email) => {
    expect(validatePickupContact({ shipping_address: address, email })).toEqual({
      missing_fields: [field],
      invalid_fields: [],
    })
  })

  it("requires a valid pickup email and accepts a complete contact", () => {
    const shippingAddress = {
      first_name: " Ada ",
      last_name: " Lovelace ",
      phone: " 123 ",
    }
    expect(validatePickupContact({
      shipping_address: shippingAddress,
      email: "invalid",
    })).toEqual({
      missing_fields: [],
      invalid_fields: ["email"],
    })
    expect(validatePickupContact({
      shipping_address: shippingAddress,
      email: " ada@example.com ",
    })).toEqual({ missing_fields: [], invalid_fields: [] })
  })

  it("derives a deterministic checkout address from the option service zone", async () => {
    const fulfillment = {
      listShippingOptions: jest.fn().mockResolvedValue([{
        id: "so_pickup",
        service_zone_id: "serzo_hk_mo",
      }]),
      retrieveServiceZone: jest.fn().mockResolvedValue({
        id: "serzo_hk_mo",
        geo_zones: [
          { id: "fgz_mo", type: "country", country_code: "mo" },
          { id: "fgz_hk", type: "country", country_code: "hk" },
        ],
      }),
    }
    const container = {
      resolve: jest.fn().mockReturnValue(fulfillment),
    } as any

    await expect(
      deriveShippingOptionServiceZoneAddress(container, "so_pickup")
    ).resolves.toEqual({
      country_code: "hk",
      province: null,
      city: null,
      postal_code: null,
    })
    expect(fulfillment.retrieveServiceZone).toHaveBeenCalledWith(
      "serzo_hk_mo",
      { relations: ["geo_zones"] }
    )
  })

  it("fails with a shipping configuration error when a service zone has no usable geo zone", async () => {
    const fulfillment = {
      listShippingOptions: jest.fn().mockResolvedValue([{
        id: "so_invalid",
        service_zone_id: "serzo_invalid",
      }]),
      retrieveServiceZone: jest.fn().mockResolvedValue({
        id: "serzo_invalid",
        geo_zones: [],
      }),
    }
    await expect(
      deriveShippingOptionServiceZoneAddress(
        { resolve: jest.fn().mockReturnValue(fulfillment) } as any,
        "so_invalid"
      )
    ).rejects.toMatchObject({
      shipping_code: "SHIPPING_OPTION_SERVICE_ZONE_INVALID",
      status: 409,
    })
  })
})
