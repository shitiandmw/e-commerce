import { beforeEach, describe, expect, it, vi } from "vitest"

const { authFetch } = vi.hoisted(() => ({
  authFetch: vi.fn(),
}))

vi.mock("./auth", () => ({
  authFetch,
  getToken: () => null,
}))

import { getOrCreateCart } from "./cart"

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

describe("getOrCreateCart", () => {
  beforeEach(() => {
    localStorage.clear()
    authFetch.mockReset()
  })

  it("retains the stored cart after a transient server error", async () => {
    localStorage.setItem("medusa_cart_id", "cart_existing")
    authFetch.mockResolvedValueOnce(jsonResponse({ message: "Lock timeout" }, 500))

    await expect(getOrCreateCart()).rejects.toMatchObject({ status: 500 })

    expect(localStorage.getItem("medusa_cart_id")).toBe("cart_existing")
    expect(authFetch).toHaveBeenCalledTimes(1)
    expect(authFetch.mock.calls.some(([path, options]) =>
      path === "/api/cart" && options?.method === "POST"
    )).toBe(false)
  })

  it("replaces a stored cart only after a 404", async () => {
    localStorage.setItem("medusa_cart_id", "cart_missing")
    authFetch
      .mockResolvedValueOnce(jsonResponse({ message: "Not found" }, 404))
      .mockResolvedValueOnce(jsonResponse({ regions: [{ id: "reg_1" }] }))
      .mockResolvedValueOnce(jsonResponse({ cart: { id: "cart_new", items: [] } }))

    await expect(getOrCreateCart()).resolves.toMatchObject({ id: "cart_new" })

    expect(localStorage.getItem("medusa_cart_id")).toBe("cart_new")
    expect(authFetch).toHaveBeenCalledTimes(3)
    expect(authFetch).toHaveBeenLastCalledWith(
      "/api/cart",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("shares one in-flight load across concurrent callers", async () => {
    localStorage.setItem("medusa_cart_id", "cart_existing")
    let resolveRequest!: (response: Response) => void
    authFetch.mockReturnValueOnce(new Promise<Response>((resolve) => {
      resolveRequest = resolve
    }))

    const first = getOrCreateCart()
    const second = getOrCreateCart()
    resolveRequest(jsonResponse({ cart: { id: "cart_existing", items: [] } }))

    await expect(Promise.all([first, second])).resolves.toEqual([
      { id: "cart_existing", items: [] },
      { id: "cart_existing", items: [] },
    ])
    expect(authFetch).toHaveBeenCalledTimes(1)
  })

  it("creates only one cart across concurrent callers", async () => {
    authFetch
      .mockResolvedValueOnce(jsonResponse({ regions: [{ id: "reg_1" }] }))
      .mockResolvedValueOnce(jsonResponse({ cart: { id: "cart_new", items: [] } }))

    const carts = await Promise.all([getOrCreateCart(), getOrCreateCart()])

    expect(carts.map((cart) => cart.id)).toEqual(["cart_new", "cart_new"])
    expect(authFetch).toHaveBeenCalledTimes(2)
    expect(authFetch.mock.calls.filter(([path]) => path === "/api/cart")).toHaveLength(1)
  })
})
