import assert from "node:assert/strict"
import test from "node:test"

import {
  buildProductListHref,
  getProductListReturnTo,
  parseProductListState,
  withProductListReturnTo,
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

test("falls back safely when edit has no valid list source", () => {
  assert.equal(getProductListReturnTo(), "/products")
  assert.equal(getProductListReturnTo("https://example.com/products"), "/products")
  assert.equal(getProductListReturnTo("//example.com/products"), "/products")
  assert.equal(getProductListReturnTo("/dashboard"), "/products")
})

test("normalizes source state and ignores unsupported parameters", () => {
  assert.equal(
    getProductListReturnTo(
      "/products?page=4&q=cohiba&status=published&sort=created_at&unsafe=1"
    ),
    "/products?page=4&q=cohiba&status=published&sort=created_at"
  )
  assert.equal(
    withProductListReturnTo(
      "/products/prod_1/edit",
      "/products?page=4&status=published"
    ),
    "/products/prod_1/edit?from=%2Fproducts%3Fpage%3D4%26status%3Dpublished"
  )
})
