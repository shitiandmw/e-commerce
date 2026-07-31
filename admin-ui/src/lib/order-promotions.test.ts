import assert from "node:assert/strict"
import test from "node:test"

import { getOrderPromotionDisplays } from "./order-promotions"

test("deduplicates a code allocated across multiple order items", () => {
  assert.deepEqual(
    getOrderPromotionDisplays({
      items: [
        { adjustments: [{ code: "SAVE20", promotion_id: "promo_1" }] },
        { adjustments: [{ code: "save20", promotion_id: "promo_1" }] },
      ],
      promotions: [{ id: "promo_1", code: "SAVE20", is_automatic: false }],
    }),
    [{ code: "SAVE20", promotion_id: "promo_1", is_automatic: false }]
  )
})

test("keeps the code captured by the order when a promotion is renamed", () => {
  assert.deepEqual(
    getOrderPromotionDisplays({
      items: [
        { adjustments: [{ code: "OLD20", promotion_id: "promo_1" }] },
      ],
      promotions: [{ id: "promo_1", code: "NEW20", is_automatic: false }],
    }),
    [{ code: "OLD20", promotion_id: "promo_1", is_automatic: false }]
  )
})

test("keeps an order snapshot when its promotion no longer exists", () => {
  assert.deepEqual(
    getOrderPromotionDisplays({
      items: [{ adjustments: [{ code: "ARCHIVED10", promotion_id: "promo_old" }] }],
      promotions: [],
    }),
    [{ code: "ARCHIVED10", promotion_id: undefined, is_automatic: false }]
  )
})

test("falls back to the live relation and identifies automatic promotions", () => {
  assert.deepEqual(
    getOrderPromotionDisplays({
      items: [],
      promotions: [{ id: "promo_auto", code: "VIP", is_automatic: true }],
    }),
    [{ code: "VIP", promotion_id: "promo_auto", is_automatic: true }]
  )
})

test("includes shipping adjustments and ignores blank codes", () => {
  assert.deepEqual(
    getOrderPromotionDisplays({
      items: [{ adjustments: [{ code: " " }] }],
      shipping_methods: [{ adjustments: [{ code: "SHIPFREE" }] }],
    }),
    [{ code: "SHIPFREE", promotion_id: undefined, is_automatic: false }]
  )
})
