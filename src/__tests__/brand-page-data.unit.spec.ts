import { BRAND_PAGE_SIZE, loadBrandPageData } from "../../storefront-v2/app/[locale]/brand/[handle]/load-brand-page-data"

describe("loadBrandPageData", () => {
  it("passes the route locale when fetching the brand and its products", async () => {
    type TestBrand = {
      id: string
      name: string
      products: { id: string }[]
    }

    const fetchBrand = jest.fn().mockResolvedValue({
      id: "brand_1",
      name: "繁體品牌",
      products: [{ id: "prod_1" }, { id: "prod_2" }],
    })
    const fetchProducts = jest.fn().mockResolvedValue({
      products: [],
      count: 0,
      offset: 0,
      limit: BRAND_PAGE_SIZE,
    })
    const getRegion = jest.fn().mockResolvedValue({ id: "reg_1" })

    const result = await loadBrandPageData<TestBrand, never>(
      {
        locale: "zh-TW",
        handle: "brand_1",
        searchParams: {},
      },
      { fetchBrand, fetchProducts, getRegion }
    )

    expect(fetchBrand).toHaveBeenCalledWith("brand_1", "zh-TW")
    expect(fetchProducts).toHaveBeenCalledWith({
      ids: ["prod_1", "prod_2"],
      limit: BRAND_PAGE_SIZE,
      order: undefined,
      locale: "zh-TW",
      region_id: "reg_1",
    })
    expect(result?.brand.name).toBe("繁體品牌")
  })

  it("does not fetch products when the brand does not exist", async () => {
    const fetchBrand = jest.fn().mockResolvedValue(null)
    const fetchProducts = jest.fn()
    const getRegion = jest.fn()

    const result = await loadBrandPageData(
      {
        locale: "zh-TW",
        handle: "missing_brand",
        searchParams: {},
      },
      { fetchBrand, fetchProducts, getRegion }
    )

    expect(result).toBeNull()
    expect(fetchProducts).not.toHaveBeenCalled()
    expect(getRegion).not.toHaveBeenCalled()
  })
})
