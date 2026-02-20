/**
 * Translation locale constants shared across the admin UI.
 * The actual translation editing is handled in Settings → Translations.
 */

export const TRANSLATION_LOCALES = ["zh-CN", "zh-TW", "en"] as const
export type TranslationLocale = (typeof TRANSLATION_LOCALES)[number]
export const DEFAULT_LOCALE: TranslationLocale = "zh-CN"
export const LOCALE_LABELS: Record<TranslationLocale, string> = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  en: "English",
}
