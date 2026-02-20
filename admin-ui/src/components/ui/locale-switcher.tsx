"use client"

import { Languages } from "lucide-react"
import {
  TRANSLATION_LOCALES,
  LOCALE_LABELS,
  DEFAULT_LOCALE,
  type TranslationLocale,
} from "@/hooks/use-entity-translation"
import { cn } from "@/lib/utils"

interface LocaleSwitcherProps {
  activeLocale: TranslationLocale
  onChange: (locale: TranslationLocale) => void
  className?: string
}

export function LocaleSwitcher({
  activeLocale,
  onChange,
  className,
}: LocaleSwitcherProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Languages className="h-4 w-4 text-muted-foreground" />
      <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
        {TRANSLATION_LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => onChange(locale)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-colors",
              activeLocale === locale
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {LOCALE_LABELS[locale]}
            {locale === DEFAULT_LOCALE && (
              <span className="ml-1 text-[10px] opacity-60">默认</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
