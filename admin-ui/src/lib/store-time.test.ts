import assert from "node:assert/strict"
import test from "node:test"

import {
  isoToStoreDatetimeLocal,
  storeDatetimeLocalToIso,
} from "./store-time"

test("converts store wall time to UTC and back", () => {
  const iso = storeDatetimeLocalToIso(
    "2026-08-01T09:30",
    "Asia/Shanghai"
  )
  assert.equal(iso, "2026-08-01T01:30:00.000Z")
  assert.equal(
    isoToStoreDatetimeLocal(iso, "Asia/Shanghai"),
    "2026-08-01T09:30"
  )
})
