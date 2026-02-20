"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"
import { TRANSLATION_LOCALES, DEFAULT_LOCALE, type TranslationLocale } from "./use-entity-translation"

// ---- Types ----

export interface TranslatableResourceItem {
  id: string
  displayValue: string
  originalValues: Record<string, string>
  translations: Record<string, Record<string, string>>
}

export interface TranslatableResourceStat {
  reference: string
  label: string
  labelEn: string
  fields: string[]
  displayField: string
  totalItems: number
  translatedCount: number
  items: TranslatableResourceItem[]
}

interface TranslationStatsResponse {
  stats: TranslatableResourceStat[]
}

// ---- Hooks ----

export function useTranslationStats(locale?: string) {
  return useQuery<TranslationStatsResponse>({
    queryKey: ["translation-stats", locale],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (locale) params.locale = locale
      return adminFetch<TranslationStatsResponse>("/admin/translation-stats", { params })
    },
  })
}

export function useSaveTranslation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      reference: string
      reference_id: string
      locale_code: string
      translations: Record<string, string>
    }) => {
      return adminFetch("/admin/translations", {
        method: "POST",
        body: data,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["translation-stats"] })
      qc.invalidateQueries({ queryKey: ["entity-translations"] })
    },
  })
}

export function useSaveBulkTranslations() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      entries: Array<{
        reference: string
        reference_id: string
        locale_code: string
        translations: Record<string, string>
      }>
    ) => {
      for (const entry of entries) {
        if (Object.values(entry.translations).some((v) => v && v.trim() !== "")) {
          await adminFetch("/admin/translations", {
            method: "POST",
            body: entry,
          })
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["translation-stats"] })
      qc.invalidateQueries({ queryKey: ["entity-translations"] })
    },
  })
}

// ---- Helpers ----

export const NON_DEFAULT_LOCALES = TRANSLATION_LOCALES.filter(
  (l) => l !== DEFAULT_LOCALE
) as TranslationLocale[]

export function getTranslationProgress(
  stat: TranslatableResourceStat,
  locale: string
): { translated: number; total: number; percentage: number } {
  const total = stat.totalItems
  let translated = 0

  for (const item of stat.items) {
    const localeT = item.translations?.[locale]
    if (localeT) {
      const hasAny = stat.fields.some(
        (f) => localeT[f] && localeT[f].trim() !== ""
      )
      if (hasAny) translated++
    }
  }

  return {
    translated,
    total,
    percentage: total > 0 ? Math.round((translated / total) * 100) : 0,
  }
}

export function getOverallProgress(
  stats: TranslatableResourceStat[],
  locale: string
): { translated: number; total: number; percentage: number } {
  let totalItems = 0
  let translatedItems = 0

  for (const stat of stats) {
    const progress = getTranslationProgress(stat, locale)
    totalItems += progress.total
    translatedItems += progress.translated
  }

  return {
    translated: translatedItems,
    total: totalItems,
    percentage: totalItems > 0 ? Math.round((translatedItems / totalItems) * 100) : 0,
  }
}
