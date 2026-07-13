export type ProductRouteSearchParams = Record<
  string,
  string | string[] | undefined
>

export interface ProductListState {
  pageIndex: number
  search: string
  status: string
  sorting: Array<{ id: string; desc: boolean }>
}

const PRODUCT_LIST_PATH = "/products"
const PRODUCT_STATUSES = new Set([
  "all",
  "published",
  "draft",
  "proposed",
  "rejected",
])
const PRODUCT_SORT_FIELDS = new Set(["title", "created_at"])

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function readProductListState(getParam: (key: string) => string | null) {
  const page = Number(getParam("page"))
  const statusParam = getParam("status") || "all"
  const sortParam = getParam("sort") || ""
  const sortId = sortParam.replace(/^-/, "")

  return {
    pageIndex:
      Number.isInteger(page) && page > 0 ? Math.min(page - 1, 99999) : 0,
    search: getParam("q") || "",
    status: PRODUCT_STATUSES.has(statusParam) ? statusParam : "all",
    sorting: PRODUCT_SORT_FIELDS.has(sortId)
      ? [{ id: sortId, desc: sortParam.startsWith("-") }]
      : [],
  } satisfies ProductListState
}

export function parseProductListState(
  searchParams?: ProductRouteSearchParams
): ProductListState {
  return readProductListState((key) => firstParam(searchParams?.[key]) ?? null)
}

export function buildProductListHref(state: ProductListState) {
  const searchParams = new URLSearchParams()

  if (state.pageIndex > 0) {
    searchParams.set("page", String(state.pageIndex + 1))
  }
  if (state.search) {
    searchParams.set("q", state.search)
  }
  if (state.status !== "all") {
    searchParams.set("status", state.status)
  }

  const sort = state.sorting[0]
  if (sort && PRODUCT_SORT_FIELDS.has(sort.id)) {
    searchParams.set("sort", `${sort.desc ? "-" : ""}${sort.id}`)
  }

  const query = searchParams.toString()
  return query ? `${PRODUCT_LIST_PATH}?${query}` : PRODUCT_LIST_PATH
}

export function getProductListReturnTo(value?: string | string[]): string {
  const candidate = firstParam(value)
  if (!candidate || !candidate.startsWith("/")) {
    return PRODUCT_LIST_PATH
  }

  try {
    const baseUrl = "https://admin.local"
    const url = new URL(candidate, baseUrl)
    if (url.origin !== baseUrl || url.pathname !== PRODUCT_LIST_PATH) {
      return PRODUCT_LIST_PATH
    }

    return buildProductListHref(
      readProductListState((key) => url.searchParams.get(key))
    )
  } catch {
    return PRODUCT_LIST_PATH
  }
}

export function withProductListReturnTo(path: string, returnTo: string) {
  const searchParams = new URLSearchParams({
    from: getProductListReturnTo(returnTo),
  })
  return `${path}?${searchParams.toString()}`
}
