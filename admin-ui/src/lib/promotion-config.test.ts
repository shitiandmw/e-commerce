import assert from "node:assert/strict"
import test from "node:test"

import {
  buildCouponApplicationMethod,
  buildProductTargetRule,
  buildProductTargetRuleBatch,
  createCampaignIdentifier,
  discountRateToPercentage,
  getProductIdsFromTargetRules,
  isEditableCoupon,
  majorToMinorAmount,
  minorToMajorAmount,
  percentageToDiscountRate,
} from "./promotion-config"

test("customer-facing discount rates map to Medusa percentages", () => {
  assert.equal(discountRateToPercentage(9), 10)
  assert.equal(discountRateToPercentage(8.5), 15)
  assert.equal(percentageToDiscountRate(10), 9)
  assert.equal(percentageToDiscountRate(15), 8.5)
})

test("currency amounts map between major and minor units", () => {
  assert.equal(majorToMinorAmount(20.5, "usd"), 2050)
  assert.equal(minorToMajorAmount(2050, "usd"), 20.5)
  assert.equal(majorToMinorAmount(2000, "jpy"), 2000)
})

test("percentage coupons always target the order and remain manual", () => {
  assert.deepEqual(
    buildCouponApplicationMethod({
      discount_type: "percentage",
      discount_value: 9,
      currency_code: "usd",
    }),
    {
      type: "percentage",
      value: 10,
      target_type: "order",
    }
  )
})

test("fixed coupons are stored in the currency's minor unit", () => {
  assert.deepEqual(
    buildCouponApplicationMethod({
      discount_type: "fixed",
      discount_value: 20.5,
      currency_code: " EUR ",
    }),
    {
      type: "fixed",
      value: 2050,
      target_type: "order",
      currency_code: "eur",
    }
  )
})

test("only manual standard order promotions use the coupon editor", () => {
  assert.equal(isEditableCoupon({
    type: "standard",
    is_automatic: false,
    application_method: { target_type: "order", type: "percentage", value: 10 },
  }), true)
  assert.equal(isEditableCoupon({
    type: "standard",
    is_automatic: true,
    application_method: { target_type: "order", type: "percentage", value: 10 },
  }), false)
  assert.equal(isEditableCoupon({
    type: "standard",
    is_automatic: false,
    application_method: { target_type: "shipping_methods", type: "percentage", value: 10 },
  }), false)
  assert.equal(isEditableCoupon({
    type: "standard",
    is_automatic: false,
    rules: [{}],
    application_method: { target_type: "order", type: "fixed", value: 2000 },
  }), false)
})

test("campaign identifiers are normalized and unique for the creation time", () => {
  assert.equal(createCampaignIdentifier(" Summer 20 ", 12345), "summer-20-9ix")
})

test("selected products are encoded as a normalized product target rule", () => {
  assert.deepEqual(buildProductTargetRule(["prod_1", " prod_2 ", "prod_1"]), {
    attribute: "items.product.id",
    operator: "eq",
    values: ["prod_1", "prod_2"],
  })
})

test("product ids are restored from serialized target-rule values", () => {
  assert.deepEqual(
    getProductIdsFromTargetRules([
      {
        id: "rule_1",
        attribute: "items.product.id",
        operator: "eq",
        values: ["prod_1", { value: "prod_2" }],
      },
    ]),
    ["prod_1", "prod_2"]
  )
})

test("editing replaces unsupported scopes with the selected product rule", () => {
  assert.deepEqual(
    buildProductTargetRuleBatch(
      [
        {
          id: "rule_products",
          attribute: "items.product.id",
          operator: "eq",
          values: ["prod_old"],
        },
        {
          id: "rule_category",
          attribute: "items.product.categories.id",
          operator: "eq",
          values: ["pcat_1"],
        },
      ],
      ["prod_new"]
    ),
    {
      update: [
        {
          id: "rule_products",
          attribute: "items.product.id",
          operator: "eq",
          values: ["prod_new"],
        },
      ],
      delete: ["rule_category"],
    }
  )
})

test("all products removes every existing target rule", () => {
  assert.deepEqual(
    buildProductTargetRuleBatch(
      [
        {
          id: "rule_products",
          attribute: "items.product.id",
          operator: "eq",
          values: ["prod_1"],
        },
      ],
      null
    ),
    { delete: ["rule_products"] }
  )
})
