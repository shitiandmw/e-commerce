import assert from "node:assert/strict"
import test from "node:test"

import {
  buildProductListHref,
  getProductReturnTo,
  parseProductListState,
  withProductReturnTo,
} from "./product-navigation"

test("parses and rebuilds product list context", () => {
  const state = parseProductListState({
    page: "3",
    q: "雪茄",
    status: "draft",
    sort: "-title",
  })

  assert.deepEqual(state, {
    pageIndex: 2,
    search: "雪茄",
    status: "draft",
    sorting: [{ id: "title", desc: true }],
  })
  assert.equal(
    buildProductListHref(state),
    "/products?page=3&q=%E9%9B%AA%E8%8C%84&status=draft&sort=-title"
  )
})

test("falls back safely when a product page has no valid source", () => {
  assert.equal(getProductReturnTo(), "/products")
  assert.equal(getProductReturnTo("https://example.com/products"), "/products")
  assert.equal(getProductReturnTo("//example.com/products"), "/products")
  assert.equal(getProductReturnTo("/dashboard"), "/products")
  assert.equal(getProductReturnTo("/brands"), "/products")
  assert.equal(getProductReturnTo("/brands/brand_1/edit"), "/products")
  assert.equal(getProductReturnTo("/brands/brand_1/products"), "/products")
  assert.equal(getProductReturnTo("/brands/%2Fdashboard"), "/products")
  assert.equal(getProductReturnTo("/collections"), "/products")
  assert.equal(getProductReturnTo("/collections/col_1/edit"), "/products")
  assert.equal(getProductReturnTo("/collections/%2Fdashboard"), "/products")
})

test("normalizes source state and ignores unsupported parameters", () => {
  assert.equal(
    getProductReturnTo(
      "/products?page=4&q=cohiba&status=published&sort=created_at&unsafe=1"
    ),
    "/products?page=4&q=cohiba&status=published&sort=created_at"
  )
  assert.equal(
    withProductReturnTo(
      "/products/prod_1/edit",
      "/products?page=4&status=published"
    ),
    "/products/prod_1/edit?from=%2Fproducts%3Fpage%3D4%26status%3Dpublished"
  )
})

test("preserves a validated brand detail source across product pages", () => {
  assert.equal(getProductReturnTo("/brands/brand_1"), "/brands/brand_1")
  assert.equal(
    getProductReturnTo("/brands/brand_1?unsupported=1#section"),
    "/brands/brand_1"
  )
  assert.equal(
    withProductReturnTo("/products/prod_1", "/brands/brand_1"),
    "/products/prod_1?from=%2Fbrands%2Fbrand_1"
  )
  assert.equal(
    withProductReturnTo("/products/prod_1/edit", "/brands/brand_1"),
    "/products/prod_1/edit?from=%2Fbrands%2Fbrand_1"
  )
})

test("preserves a validated collection detail source across product pages", () => {
  assert.equal(
    getProductReturnTo("/collections/col_1"),
    "/collections/col_1"
  )
  assert.equal(
    getProductReturnTo("/collections/col_1?unsupported=1#section"),
    "/collections/col_1"
  )
  assert.equal(
    withProductReturnTo("/products/prod_1", "/collections/col_1"),
    "/products/prod_1?from=%2Fcollections%2Fcol_1"
  )
  assert.equal(
    withProductReturnTo("/products/prod_1/edit", "/collections/col_1"),
    "/products/prod_1/edit?from=%2Fcollections%2Fcol_1"
  )
})
