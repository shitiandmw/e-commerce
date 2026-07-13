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
      offset: 0,
      order: undefined,
      locale: "zh-TW",
      region_id: "reg_1",
      price_order: undefined,
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

  it("passes every brand product id to inventory ordering before pagination", async () => {
    const productIds = Array.from({ length: BRAND_PAGE_SIZE + 1 }, (_, index) => `prod_${index + 1}`)
    const fetchBrand = jest.fn().mockResolvedValue({
      id: "brand_1",
      products: productIds.map((id) => ({ id })),
    })
    const fetchProducts = jest.fn().mockResolvedValue({
      products: [{ id: productIds[productIds.length - 1] }],
      count: productIds.length,
      offset: 0,
      limit: BRAND_PAGE_SIZE,
    })
    const getRegion = jest.fn().mockResolvedValue({ id: "reg_1" })

    const result = await loadBrandPageData(
      {
        locale: "zh-TW",
        handle: "brand_1",
        searchParams: {},
      },
      { fetchBrand, fetchProducts, getRegion },
    )

    expect(fetchProducts).toHaveBeenCalledWith({
      ids: productIds,
      limit: BRAND_PAGE_SIZE,
      offset: 0,
      order: undefined,
      locale: "zh-TW",
      region_id: "reg_1",
      price_order: undefined,
    })
    expect(result?.productsData.products).toEqual([{ id: "prod_19" }])
  })

  it("passes the requested brand page offset without slicing brand ids", async () => {
    const productIds = Array.from({ length: 20 }, (_, index) => `prod_${index + 1}`)
    const fetchBrand = jest.fn().mockResolvedValue({
      id: "brand_1",
      products: productIds.map((id) => ({ id })),
    })
    const fetchProducts = jest.fn().mockResolvedValue({
      products: [{ id: "prod_18" }, { id: "prod_19" }],
      count: productIds.length,
      offset: BRAND_PAGE_SIZE,
      limit: BRAND_PAGE_SIZE,
    })

    await loadBrandPageData(
      {
        locale: "zh-TW",
        handle: "brand_1",
        searchParams: { page: "2" },
      },
      {
        fetchBrand,
        fetchProducts,
        getRegion: jest.fn().mockResolvedValue({ id: "reg_1" }),
      },
    )

    expect(fetchProducts).toHaveBeenCalledWith(expect.objectContaining({
      ids: productIds,
      offset: BRAND_PAGE_SIZE,
    }))
  })

  it("passes descending price order to the complete brand candidate query", async () => {
    const fetchProducts = jest.fn().mockResolvedValue({
      products: [],
      count: 2,
      offset: 0,
      limit: BRAND_PAGE_SIZE,
    })

    await loadBrandPageData(
      {
        locale: "zh-TW",
        handle: "brand_1",
        searchParams: { sort: "price-desc" },
      },
      {
        fetchBrand: jest.fn().mockResolvedValue({
          id: "brand_1",
          products: [{ id: "prod_1" }, { id: "prod_2" }],
        }),
        fetchProducts,
        getRegion: jest.fn().mockResolvedValue({ id: "reg_1" }),
      },
    )

    expect(fetchProducts).toHaveBeenCalledWith(expect.objectContaining({
      ids: ["prod_1", "prod_2"],
      order: undefined,
      price_order: "desc",
    }))
  })
})
