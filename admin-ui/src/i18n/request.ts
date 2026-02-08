import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"

export const locales = ["zh-CN", "en"] as const
export const defaultLocale = "zh-CN"

export type Locale = (typeof locales)[number]

export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieLocale = store.get("locale")?.value
  const locale =
    cookieLocale && locales.includes(cookieLocale as Locale)
      ? cookieLocale
      : defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
