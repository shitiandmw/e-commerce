import { getStoreContentLocale } from "../api/store/content/brands/request-locale"

describe("getStoreContentLocale", () => {
  it("prefers the locale already attached to the request", () => {
    expect(
      getStoreContentLocale({
        locale: "zh-CN",
        query: { locale: "zh-TW" },
        headers: { "x-medusa-locale": "en" },
      })
    ).toBe("zh-CN")
  })

  it("falls back to the locale query parameter", () => {
    expect(
      getStoreContentLocale({
        query: { locale: "zh-TW" },
      })
    ).toBe("zh-TW")
  })

  it("falls back to the x-medusa-locale header", () => {
    expect(
      getStoreContentLocale({
        headers: { "x-medusa-locale": "zh-TW" },
      })
    ).toBe("zh-TW")
  })
})
