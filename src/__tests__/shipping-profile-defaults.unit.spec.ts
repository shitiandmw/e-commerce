describe("admin shipping profile defaults", () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it("keeps an explicitly provided shipping profile", async () => {
    const adminFetch = jest.fn()
    jest.doMock("../../admin-ui/src/lib/admin-api", () => ({ adminFetch }))

    const { withDefaultShippingProfile } = require(
      "../../admin-ui/src/lib/shipping-profiles"
    )

    await expect(
      withDefaultShippingProfile({ title: "Product", shipping_profile_id: "sp_custom" })
    ).resolves.toEqual({
      title: "Product",
      shipping_profile_id: "sp_custom",
    })
    expect(adminFetch).not.toHaveBeenCalled()
  })

  it("treats a blank shipping profile as missing", async () => {
    const adminFetch = jest.fn().mockResolvedValue({
      shipping_profiles: [{ id: "sp_default", type: "default" }],
    })
    jest.doMock("../../admin-ui/src/lib/admin-api", () => ({ adminFetch }))

    const { withDefaultShippingProfile } = require(
      "../../admin-ui/src/lib/shipping-profiles"
    )

    await expect(
      withDefaultShippingProfile({ title: "Product", shipping_profile_id: "  " })
    ).resolves.toEqual({
      title: "Product",
      shipping_profile_id: "sp_default",
    })
  })

  it("adds the default shipping profile when missing", async () => {
    const adminFetch = jest.fn().mockResolvedValue({
      shipping_profiles: [
        { id: "sp_custom", type: "custom" },
        { id: "sp_default", type: "default" },
      ],
    })
    jest.doMock("../../admin-ui/src/lib/admin-api", () => ({ adminFetch }))

    const { withDefaultShippingProfile } = require(
      "../../admin-ui/src/lib/shipping-profiles"
    )

    await expect(withDefaultShippingProfile({ title: "Product" })).resolves.toEqual({
      title: "Product",
      shipping_profile_id: "sp_default",
    })
    expect(adminFetch).toHaveBeenCalledWith("/admin/shipping-profiles", {
      params: { limit: "50" },
    })
  })
})

describe("product shipping profile backfill options", () => {
  it("defaults to dry-run mode", async () => {
    const { parseOptions } = require(
      "../scripts/backfill-product-shipping-profiles"
    )

    expect(parseOptions([])).toEqual({
      execute: false,
      limit: 100,
      sampleSize: 10,
    })
  })

  it("requires an explicit execute flag", async () => {
    const { parseOptions } = require(
      "../scripts/backfill-product-shipping-profiles"
    )

    expect(parseOptions(["execute", "limit=25", "sample", "3"])).toEqual({
      execute: true,
      limit: 25,
      sampleSize: 3,
    })
  })
})
