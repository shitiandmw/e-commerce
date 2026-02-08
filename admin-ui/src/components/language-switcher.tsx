"use client"

import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Globe } from "lucide-react"
import { cn } from "@/lib/utils"

const localeLabels: Record<string, string> = {
  "zh-CN": "中文",
  en: "English",
}

export function LanguageSwitcher() {
  const locale = useLocale()
  const t = useTranslations("languageSwitcher")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const toggleLocale = () => {
    const nextLocale = locale === "zh-CN" ? "en" : "zh-CN"
    // Set locale cookie and refresh page
    document.cookie = `locale=${nextLocale};path=/;max-age=${60 * 60 * 24 * 365}`
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <button
      onClick={toggleLocale}
      disabled={isPending}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        isPending && "opacity-50 cursor-not-allowed"
      )}
      title={t("label")}
    >
      <Globe className="h-4 w-4" />
      <span>{localeLabels[locale]}</span>
    </button>
  )
}
