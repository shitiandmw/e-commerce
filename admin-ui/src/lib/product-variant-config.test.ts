import assert from "node:assert/strict"
import test from "node:test"

import {
  buildOptionCombinations,
  createDefaultProductVariantConfiguration,
  getConfigurationErrors,
  initializeProductVariantConfiguration,
  reconcileVariantMatrix,
  stopPendingDeleteVariant,
  type ProductVariantConfiguration,
} from "./product-variant-config"

const options = [
  {
    key: "option_size",
    title: "Size",
    values: [
      { key: "value_small", value: "Small" },
      { key: "value_large", value: "Large" },
    ],
  },
  {
    key: "option_color",
    title: "Color",
    values: [
      { key: "value_red", value: "Red" },
      { key: "value_blue", value: "Blue" },
    ],
  },
]

const saleFields = {
  sale_enabled: false,
  sale_price: null,
  sale_mode: "ongoing" as const,
  sale_starts_at: "",
  sale_ends_at: "",
  sale_status: "not_configured" as const,
}

test("builds the complete option matrix with explicit value keys", () => {
  assert.deepEqual(buildOptionCombinations(options), [
    { option_size: "value_small", option_color: "value_red" },
    { option_size: "value_small", option_color: "value_blue" },
    { option_size: "value_large", option_color: "value_red" },
    { option_size: "value_large", option_color: "value_blue" },
  ])
})

test("keeps the persisted variant ID when reconciling a known combination", () => {
  const configuration: ProductVariantConfiguration = {
    options: [options[0]],
    variants: [{
      key: "variant_small",
      id: "variant_small",
      title: "Small",
      sku: "SKU-S",
      price: 10,
      currency_code: "usd",
      inventory_quantity: 2,
      manage_inventory: true,
      option_values: { option_size: "value_small" },
      status: "active",
      initial_status: "active",
      ...saleFields,
    }],
  }

  const result = reconcileVariantMatrix(configuration, "Product")

  assert.equal(result.variants[0].id, "variant_small")
  assert.equal(result.variants[0].status, "active")
  assert.equal(result.variants.filter((variant) => !variant.id).length, 1)
})

test("marks an extra persisted duplicate for explicit permanent deletion", () => {
  const baseVariant = {
    title: "Small",
    price: 10,
    currency_code: "usd",
    inventory_quantity: 0,
    manage_inventory: true,
    option_values: { option_size: "value_small" },
    status: "active" as const,
    initial_status: "active" as const,
    ...saleFields,
  }
  const configuration: ProductVariantConfiguration = {
    options: [{ ...options[0], values: [options[0].values[0]] }],
    variants: [
      { ...baseVariant, key: "variant_1", id: "variant_1", sku: "SKU-1" },
      { ...baseVariant, key: "variant_2", id: "variant_2", sku: "SKU-2" },
    ],
  }

  const result = reconcileVariantMatrix(configuration, "Product")

  assert.equal(result.variants.filter((variant) => variant.status === "active").length, 1)
  assert.deepEqual(
    result.variants.filter((variant) => variant.status === "delete").map((variant) => variant.id),
    ["variant_2"]
  )
})

test("changes only the blocked pending deletion to stopped", () => {
  const baseVariant = {
    title: "Small",
    price: 10,
    currency_code: "usd",
    inventory_quantity: 0,
    manage_inventory: true,
    option_values: { option_size: "value_small" },
    status: "delete" as const,
    initial_status: "active" as const,
    ...saleFields,
  }
  const configuration: ProductVariantConfiguration = {
    options: [{ ...options[0], values: [options[0].values[0]] }],
    variants: [
      { ...baseVariant, key: "variant_1", id: "variant_1", sku: "SKU-1" },
      { ...baseVariant, key: "variant_2", id: "variant_2", sku: "SKU-2" },
    ],
  }

  const result = stopPendingDeleteVariant(configuration, "variant_2")

  assert.equal(result?.variants[0].status, "delete")
  assert.equal(result?.variants[1].status, "stopped")
  assert.equal(stopPendingDeleteVariant(configuration, "variant_unknown"), null)
})

test("initializes original and sale prices using currency fraction digits", () => {
  const configuration = initializeProductVariantConfiguration({
    id: "product_1",
    title: "Product",
    status: "published",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    options: [{
      id: "option_1",
      title: "Size",
      values: [{ id: "value_1", value: "Default" }],
    }],
    variants: [{
      id: "variant_1",
      title: "Default",
      sku: "SKU-1",
      prices: [{ amount: 1200, currency_code: "jpy" }],
      options: [{ id: "value_1", value: "Default", option_id: "option_1" }],
    }],
  }, [{
    variant_id: "variant_1",
    enabled: true,
    mode: "ongoing",
    amount: 1000,
    currency_code: "jpy",
    starts_at: null,
    ends_at: null,
    status: "active",
  }])

  assert.equal(configuration.variants[0].price, 1200)
  assert.equal(configuration.variants[0].sale_price, 1000)
  assert.equal(configuration.variants[0].sale_enabled, true)
})

test("validates sale amount and scheduled dates", () => {
  const configuration = createDefaultProductVariantConfiguration("Product")
  const variant = configuration.variants[0]
  variant.price = 100
  variant.sale_enabled = true
  variant.sale_price = 100
  assert.ok(getConfigurationErrors(configuration).includes("优惠价必须低于原价"))

  variant.sale_price = 80
  variant.sale_mode = "scheduled"
  assert.ok(
    getConfigurationErrors(configuration).includes("定时优惠必须填写开始和结束时间")
  )
})
