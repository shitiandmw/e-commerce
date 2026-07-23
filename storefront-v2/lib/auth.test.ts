import { afterEach, describe, expect, it, vi } from "vitest"
import { requestPasswordReset, resetPassword } from "./auth"

describe("password reset auth client", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("requests a reset token for a normalized email", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", fetchMock)

    await requestPasswordReset(" Customer@Example.COM ")

    expect(fetchMock).toHaveBeenCalledWith("/api/auth?action=reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "customer@example.com" }),
    })
  })

  it("does not report success when the reset-token request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))

    await expect(requestPasswordReset("customer@example.com")).rejects.toThrow(
      "RESET_REQUEST_FAILED"
    )
  })

  it("updates the password using the single-use reset token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", fetchMock)

    await resetPassword(" Customer@Example.COM ", "new-password", "reset-token")

    expect(fetchMock).toHaveBeenCalledWith("/api/auth?action=update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer reset-token",
      },
      body: JSON.stringify({
        email: "customer@example.com",
        password: "new-password",
      }),
    })
  })
})
