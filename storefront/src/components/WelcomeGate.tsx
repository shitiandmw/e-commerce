"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { Locale } from "@/lib/i18n"

const STORAGE_KEY = "welcome_gate_passed"

const LANG_OPTIONS: { locale: Locale; label: string }[] = [
  { locale: "zh-TW", label: "繁中" },
  { locale: "en", label: "EN" },
  { locale: "zh-CN", label: "简中" },
]

export default function WelcomeGate({ locale, dict }: { locale: Locale; dict: Record<string, string> }) {
  const [show, setShow] = useState(false)
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  const handleConfirm = () => {
    localStorage.setItem(STORAGE_KEY, "1")
    document.cookie = `NEXT_LOCALE=${selectedLocale}; path=/; max-age=${365 * 24 * 60 * 60}`
    if (selectedLocale !== locale) {
      const newPath = pathname.replace(`/${locale}`, `/${selectedLocale}`)
      window.location.href = newPath || `/${selectedLocale}`
      return
    }
    setShow(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60" style={{ padding: '24px' }}>
      <div className="w-full rounded-3xl bg-white shadow-2xl" style={{ maxWidth: '440px', padding: '32px 36px' }}>
        {/* Language pills */}
        <div className="mb-8 flex items-center justify-center gap-3">
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.locale}
              onClick={() => setSelectedLocale(opt.locale)}
              className={`rounded-full text-sm transition-all ${
                selectedLocale === opt.locale
                  ? "bg-accent font-semibold text-white"
                  : "border border-gray-200 bg-white text-gray-400 hover:border-gray-300"
              }`}
              style={{ padding: '6px 24px', minHeight: 'auto' }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">TimeCigar</h1>
          <p className="mt-2 text-sm tracking-[0.35em] text-gray-400">{dict.welcome_brand_subtitle}</p>
        </div>

        {/* Age question */}
        <p className="mb-8 text-center text-xl font-bold text-gray-900">
          {dict.age_question}
        </p>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          className="mb-8 w-full bg-accent text-base font-semibold text-white transition-colors hover:bg-accent/90"
          style={{ padding: '14px 0', borderRadius: '8px' }}
        >
          {dict.confirm}
        </button>

        {/* Disclaimer */}
        <p className="mb-5 text-center text-xs leading-relaxed text-gray-400">
          {dict.tobacco_disclaimer}
        </p>

        {/* Health warning */}
        <p className="text-center text-sm font-bold text-accent">
          {dict.smoking_warning}
        </p>
      </div>
    </div>
  )
}
