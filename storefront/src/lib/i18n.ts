export const locales = ["zh-CN", "zh-TW", "en"] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = "zh-CN"

const dictionaries: Record<Locale, () => Promise<Record<string, string>>> = {
  "zh-CN": () => import("@/locales/zh-CN/common.json").then((m) => m.default),
  "zh-TW": () => import("@/locales/zh-TW/common.json").then((m) => m.default),
  en: () => import("@/locales/en/common.json").then((m) => m.default),
}

export async function getDictionary(locale: Locale): Promise<Record<string, string>> {
  const loader = dictionaries[locale] || dictionaries[defaultLocale]
  return loader()
}

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

/** Get localized content field with fallback: current locale → zh-CN → original */
export function getLocalizedField(
  item: Record<string, any>,
  field: string,
  locale: Locale
): string {
  if (locale === "en" && item[`${field}_en`]) return item[`${field}_en`]
  if (locale === "zh-TW" && item[`${field}_zh_tw`]) return item[`${field}_zh_tw`]
  if (locale === "zh-CN" && item[`${field}_zh_cn`]) return item[`${field}_zh_cn`]
  // fallback chain
  return item[`${field}_en`] || item[`${field}_zh_tw`] || item[`${field}_zh_cn`] || item[field] || ""
}
