import { act, fireEvent, render, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { RestockRequestButton } from "./restock-request-button"
import { getRestockStatus, requestRestock } from "@/lib/restock-demand"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => ({
    request_restock: "Request restock",
    restock_requested: "Restock requested",
    restock_request_success: "Request recorded",
    restock_request_failed: "Request failed",
  })[key] || key,
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock("@/lib/restock-demand", () => ({
  getRestockStatus: vi.fn(),
  requestRestock: vi.fn(),
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

const idleStatus = {
  requested: false,
  round_id: "round_1",
  requester_count: 0,
}

describe("RestockRequestButton", () => {
  beforeEach(() => {
    vi.mocked(getRestockStatus).mockResolvedValue(idleStatus)
  })

  it("does not apply a delayed SKU A submission response to SKU B", async () => {
    const skuARequest = deferred<typeof idleStatus>()
    vi.mocked(requestRestock).mockReturnValueOnce(skuARequest.promise)

    const view = render(<RestockRequestButton variantId="variant_a" />)
    let button = view.getByRole("button", { name: "Request restock" }) as HTMLButtonElement
    await waitFor(() => expect(button.disabled).toBe(false))

    fireEvent.click(button)
    expect(requestRestock).toHaveBeenCalledWith("variant_a")

    view.rerender(<RestockRequestButton variantId="variant_b" />)
    button = view.getByRole("button", { name: "Request restock" }) as HTMLButtonElement
    await waitFor(() => expect(button.disabled).toBe(false))

    await act(async () => {
      skuARequest.resolve({
        requested: true,
        round_id: "round_a",
        requester_count: 1,
      })
      await skuARequest.promise
    })

    expect(button.textContent).toContain("Request restock")
    expect(button.textContent).not.toContain("Restock requested")
    expect(button.disabled).toBe(false)
  })
})
