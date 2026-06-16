export const BRAND_PAGE_SIZE = 18

type BrandWithProducts = {
  products?: Array<{ id: string } | null> | null
}

type ProductListResponse<Product> = {
  products: Product[]
  count: number
  offset: number
  limit: number
}

type BrandPageDataDependencies<Brand extends BrandWithProducts, Product> = {
  fetchBrand: (id: string, locale?: string) => Promise<Brand | null>
  fetchProducts: (params: {
    ids: string[]
    limit: number
    order?: string
    locale?: string
    region_id?: string
  }) => Promise<ProductListResponse<Product>>
  getRegion: () => Promise<{ id: string }>
}

type BrandPageDataParams = {
  locale: string
  handle: string
  searchParams: Record<string, string | string[] | undefined>
}

function firstSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export async function loadBrandPageData<Brand extends BrandWithProducts, Product>(
  { locale, handle, searchParams }: BrandPageDataParams,
  { fetchBrand, fetchProducts, getRegion }: BrandPageDataDependencies<Brand, Product>
) {
  const rawPage = parseInt(firstSearchParam(searchParams.page) ?? "1", 10)
  const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1
  const sort = firstSearchParam(searchParams.sort) ?? "recommended"
  const offset = (page - 1) * BRAND_PAGE_SIZE

  let order: string | undefined
  switch (sort) {
    case "name":
      order = "title"
      break
    default:
      order = undefined
  }

  const brand = await fetchBrand(handle, locale)
  if (!brand) {
    return null
  }

  const productIds = (brand.products ?? [])
    .filter((product): product is { id: string } => Boolean(product))
    .map((product) => product.id)
  const region = await getRegion()

  let productsData: ProductListResponse<Product> = {
    products: [],
    count: 0,
    offset: 0,
    limit: BRAND_PAGE_SIZE,
  }

  if (productIds.length > 0) {
    const pageIds = productIds.slice(offset, offset + BRAND_PAGE_SIZE)
    if (pageIds.length > 0) {
      const data = await fetchProducts({
        ids: pageIds,
        limit: BRAND_PAGE_SIZE,
        order,
        locale,
        region_id: region.id,
      })
      productsData = { ...data, count: productIds.length }
    } else {
      productsData = {
        products: [],
        count: productIds.length,
        offset,
        limit: BRAND_PAGE_SIZE,
      }
    }
  }

  return {
    brand,
    productsData,
    page,
    sort,
  }
}
