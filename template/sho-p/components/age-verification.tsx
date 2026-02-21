"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function AgeVerification() {
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
            年齡驗證
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2 leading-relaxed">
            本網站僅供年滿 18 歲人士瀏覽及購買雪茄產品。請確認您已年滿 18 歲。
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={handleConfirm}
            className="bg-gold text-primary-foreground hover:bg-gold-dark font-medium tracking-wide"
          >
            我已年滿 18 歲
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = "https://www.google.com"}
            className="border-border/50 text-muted-foreground hover:text-foreground"
          >
            我未滿 18 歲
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground/50 mt-2 leading-relaxed">
          吸煙危害健康。煙草產品含有尼古丁，會導致成癮。
        </p>
      </DialogContent>
    </Dialog>
  )
}
