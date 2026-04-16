"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"

export default function BrandError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-serif font-bold text-foreground">{t("error_title")}</h1>
      <p className="mt-3 text-sm text-muted-foreground max-w-md">{t("error_description")}</p>
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={reset}
          className="border border-gold/50 px-5 py-2 text-sm text-gold hover:bg-gold/10 transition-colors"
        >
          {t("retry")}
        </button>
        <Link
          href="/"
          className="px-5 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("home")}
        </Link>
      </div>
    </div>
  )
}
