"use client"

import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import { Globe } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const languages = [
  { code: "zh-TW", label: "繁體中文" },
  { code: "zh-CN", label: "简体中文" },
  { code: "en", label: "English" },
]

export function AgeVerification() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const verified = localStorage.getItem("age-verified")
    if (!verified) {
      setOpen(true)
    }
  }, [])

  const handleConfirm = () => {
    localStorage.setItem("age-verified", "true")
    setOpen(false)
  }

  const switchLocale = (code: string) => {
    router.replace(pathname, { locale: code })
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="bg-card border-gold/20 max-w-md text-center"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center">
          <div className="text-gold font-serif text-2xl font-bold tracking-wider mb-2">
            TIMECIGAR
          </div>
          <DialogTitle className="text-foreground text-lg font-serif">
            {t("age_question")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2 leading-relaxed">
            {t("tobacco_disclaimer")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={handleConfirm}
            className="bg-gold text-primary-foreground hover:bg-gold-dark font-medium tracking-wide"
          >
            {t("confirm")}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = "https://www.google.com"}
            className="border-border/50 text-muted-foreground hover:text-foreground"
          >
            {t("deny")}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground/50 mt-2 leading-relaxed">
          {t("smoking_warning")}
        </p>

        {/* language switcher */}
        <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-border/20">
          <Globe className="size-3 text-muted-foreground/40" />
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => switchLocale(l.code)}
              className={cn(
                "px-2 py-0.5 text-[11px] rounded transition-colors",
                l.code === locale
                  ? "text-gold font-medium"
                  : "text-muted-foreground/50 hover:text-foreground/70"
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
