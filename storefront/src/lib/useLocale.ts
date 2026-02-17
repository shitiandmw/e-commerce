"use client"

import { usePathname } from "next/navigation"
import type { Locale } from "@/lib/i18n"

const LOCALE_REGEX = /^\/(zh-CN|zh-TW|en)/

export function useLocale(): Locale {
  const pathname = usePathname()
  const match = pathname.match(LOCALE_REGEX)
  return (match?.[1] as Locale) || "zh-CN"
}

/** Prefix a path with the current locale */
export function useLocalePath() {
  const locale = useLocale()
  return (path: string) => `/${locale}${path}`
}
