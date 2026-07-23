import assert from "node:assert/strict"
import test from "node:test"

import {
  buildOptionCombinations,
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
