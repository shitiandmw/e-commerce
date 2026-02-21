import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"

export const locales = ["zh-CN", "en"] as const
export const defaultLocale = "zh-CN"

export type Locale = (typeof locales)[number]

// All namespace modules - each corresponds to a JSON file in messages/<locale>/
const namespaces = [
  "common",
  "sidebar",
  "auth",
  "dashboard",
  "products",
  "orders",
  "customers",
  "brands",
  "tags",
  "inventory",
  "settings",
  "media",
  "analytics",
  "importExport",
  "promotions",
  "shipping",
  "pages",
  "seo",
  "announcements",
  "popups",
  "banners",
  "articles",
  "collections",
  "menus",
  "product-categories",
] as const

async function loadMessages(locale: string) {
  const messages: Record<string, unknown> = {}

  for (const ns of namespaces) {
    try {
      const mod = await import(`../../messages/${locale}/${ns}.json`)
      Object.assign(messages, mod.default)
    } catch {
      // Namespace file not found, skip silently
    }
  }

  return messages
}

export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieLocale = store.get("locale")?.value
  const locale =
    cookieLocale && locales.includes(cookieLocale as Locale)
      ? cookieLocale
      : defaultLocale

  return {
    locale,
    messages: await loadMessages(locale),
  }
})
