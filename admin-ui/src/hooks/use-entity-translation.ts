"use client"

import { useState, useCallback, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"

export const TRANSLATION_LOCALES = ["zh-CN", "zh-TW", "en"] as const
export type TranslationLocale = (typeof TRANSLATION_LOCALES)[number]
export const DEFAULT_LOCALE: TranslationLocale = "zh-CN"
export const LOCALE_LABELS: Record<TranslationLocale, string> = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  en: "English",
}

interface TranslationRecord {
  [field: string]: string
}

interface TranslationResponse {
  translations: Array<{
    id: string
    reference: string
    reference_id: string
    locale_code: string
    translations: TranslationRecord
  }>
}

interface UseEntityTranslationOptions {
  reference: string
  referenceId: string | undefined
  translatableFields: string[]
}

export function useEntityTranslation({
  reference,
  referenceId,
  translatableFields,
}: UseEntityTranslationOptions) {
  const queryClient = useQueryClient()
  const [activeLocale, setActiveLocale] = useState<TranslationLocale>(DEFAULT_LOCALE)
  const [localTranslations, setLocalTranslations] = useState<
    Record<string, TranslationRecord>
  >({})
  const [isDirty, setIsDirty] = useState(false)

  // Fetch translations for non-default locales
  const translationsQuery = useQuery<TranslationResponse>({
    queryKey: ["entity-translations", reference, referenceId],
    queryFn: () =>
      adminFetch<TranslationResponse>("/admin/translations", {
        params: { reference, reference_id: referenceId! },
      }),
    enabled: !!referenceId,
  })

  // Sync fetched translations into local state
  useEffect(() => {
    if (translationsQuery.data?.translations) {
      const map: Record<string, TranslationRecord> = {}
      for (const t of translationsQuery.data.translations) {
        map[t.locale_code] = t.translations
      }
      setLocalTranslations(map)
    }
  }, [translationsQuery.data])

  const getFieldValue = useCallback(
    (field: string, formValue: string): string => {
      if (activeLocale === DEFAULT_LOCALE) return formValue
      return localTranslations[activeLocale]?.[field] || ""
    },
    [activeLocale, localTranslations]
  )

  const setFieldValue = useCallback(
    (field: string, value: string) => {
      if (activeLocale === DEFAULT_LOCALE) return // default locale uses form directly
      setLocalTranslations((prev) => ({
        ...prev,
        [activeLocale]: { ...prev[activeLocale], [field]: value },
      }))
      setIsDirty(true)
    },
    [activeLocale]
  )

  // Save translation mutation
  const saveMutation = useMutation({
    mutationFn: async (locale: TranslationLocale) => {
      if (!referenceId || locale === DEFAULT_LOCALE) return
      const translations = localTranslations[locale]
      if (!translations || Object.values(translations).every((v) => !v)) return
      return adminFetch("/admin/translations", {
        method: "POST",
        body: {
          reference,
          reference_id: referenceId,
          locale_code: locale,
          translations,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["entity-translations", reference, referenceId],
      })
      setIsDirty(false)
    },
  })

  // Save all non-default locale translations
  const saveAllTranslations = useCallback(async () => {
    if (!referenceId) return
    const locales = TRANSLATION_LOCALES.filter((l) => l !== DEFAULT_LOCALE)
    for (const locale of locales) {
      const t = localTranslations[locale]
      if (t && Object.values(t).some((v) => v)) {
        await saveMutation.mutateAsync(locale)
      }
    }
  }, [referenceId, localTranslations, saveMutation])

  const isDefaultLocale = activeLocale === DEFAULT_LOCALE

  return {
    activeLocale,
    setActiveLocale,
    isDefaultLocale,
    getFieldValue,
    setFieldValue,
    saveAllTranslations,
    isSaving: saveMutation.isPending,
    isLoading: translationsQuery.isLoading,
    isDirty,
    localTranslations,
  }
}
