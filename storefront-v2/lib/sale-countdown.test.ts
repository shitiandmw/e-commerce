import { describe, expect, it } from "vitest"
import {
  formatSaleCountdownClock,
  getSaleCountdownState,
} from "./sale-countdown"

const NOW = Date.parse("2026-08-01T00:00:00.000Z")

describe("sale countdown", () => {
  it("uses a date beyond seven days", () => {
    expect(getSaleCountdownState("2026-08-09T00:00:01.000Z", NOW)).toMatchObject({
      kind: "date",
    })
  })

  it("uses whole days between 72 hours and seven days", () => {
    expect(getSaleCountdownState("2026-08-05T12:00:00.000Z", NOW)).toEqual({
      kind: "days",
      remaining_ms: 4.5 * 24 * 60 * 60 * 1000,
      days: 5,
    })
  })

  it("uses a second-level clock within 72 hours", () => {
    const state = getSaleCountdownState("2026-08-03T13:08:42.000Z", NOW)
    expect(state).toMatchObject({
      kind: "clock",
      days: 2,
      hours: 13,
      minutes: 8,
      seconds: 42,
    })
    if (state.kind === "clock") {
      expect(formatSaleCountdownClock(state, "zh-CN")).toBe("02天 13:08:42")
      expect(formatSaleCountdownClock(state, "en")).toBe("02d 13:08:42")
    }
  })

  it("expires exactly at the backend end time", () => {
    expect(getSaleCountdownState("2026-08-01T00:00:00.000Z", NOW)).toEqual({
      kind: "expired",
      remaining_ms: 0,
    })
  })
})
