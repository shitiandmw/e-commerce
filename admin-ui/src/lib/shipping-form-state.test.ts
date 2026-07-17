import assert from "node:assert/strict"
import test from "node:test"

import {
  getPickupLocationUnavailabilityReason,
  productShippingOptionIdsSchema,
  toggleShippingOptionId,
} from "./shipping-form-state"

const validLocation = {
  is_enabled: true,
  address: "1 Queen's Road",
  shipping_option_id: null,
}

test("pickup candidates only reject disabled or occupied locations", () => {
  assert.equal(
    getPickupLocationUnavailabilityReason(
      { ...validLocation, is_enabled: false }
    ),
    "disabled"
  )
  assert.equal(
    getPickupLocationUnavailabilityReason(
      { ...validLocation, shipping_option_id: "so_other" }
    ),
    "already_assigned"
  )
  assert.equal(
    getPickupLocationUnavailabilityReason(validLocation),
    null
  )
})

test("pickup candidates reject other bindings and retain the current binding", () => {
  const boundLocation = {
    ...validLocation,
    shipping_option_id: "so_current",
  }
  assert.equal(
    getPickupLocationUnavailabilityReason(boundLocation),
    "already_assigned"
  )
  assert.equal(
    getPickupLocationUnavailabilityReason(
      boundLocation,
      "so_current"
    ),
    null
  )
})

test("shipping option selection validates immediately in both directions", () => {
  const selected = toggleShippingOptionId([], "so_pickup", true)
  assert.deepEqual(selected, ["so_pickup"])
  assert.equal(productShippingOptionIdsSchema.safeParse(selected).success, true)

  const empty = toggleShippingOptionId(selected, "so_pickup", false)
  assert.deepEqual(empty, [])
  assert.equal(productShippingOptionIdsSchema.safeParse(empty).success, false)
})
