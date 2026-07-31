import assert from "node:assert/strict"
import test from "node:test"

import { getPromotionDisplayStatus } from "./promotion-status"

const now = new Date("2026-07-29T12:00:00.000Z")

test("explicit draft and inactive states take precedence over campaign dates", () => {
  assert.equal(
    getPromotionDisplayStatus({ status: "draft" }, now),
    "draft"
  )
  assert.equal(
    getPromotionDisplayStatus({ status: "inactive" }, now),
    "inactive"
  )
})

test("active promotions follow their campaign window", () => {
  assert.equal(
    getPromotionDisplayStatus({
      status: "active",
      campaign: { starts_at: "2026-07-30T00:00:00.000Z" },
    }, now),
    "scheduled"
  )
  assert.equal(
    getPromotionDisplayStatus({
      status: "active",
      campaign: { ends_at: "2026-07-29T12:00:00.000Z" },
    }, now),
    "expired"
  )
  assert.equal(
    getPromotionDisplayStatus({
      status: "active",
      campaign: {
        starts_at: "2026-07-01T00:00:00.000Z",
        ends_at: "2026-08-01T00:00:00.000Z",
      },
    }, now),
    "active"
  )
})
