"use client"

import { useState, useEffect, useCallback } from "react"

interface CouponPopupData {
  id: string
  title?: string
  description?: string
  image_url?: string
  button_text?: string
  popup_type: "coupon"
  coupon_code?: string
  trigger_type: "first_visit" | "every_visit" | "specific_page"
  display_frequency: "once" | "once_per_session" | "once_per_day"
}

const COOKIE_KEY = "coupon_popup_shown"

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`
}

function shouldShowCouponPopup(): boolean {
  if (typeof window === "undefined") return false
  const last = getCookie(COOKIE_KEY)
  if (!last) return true
  const lastDate = new Date(parseInt(last, 10))
  const now = new Date()
  return lastDate.toDateString() !== now.toDateString()
}

function markCouponPopupShown() {
  setCookie(COOKIE_KEY, Date.now().toString(), 365)
}

/* PLACEHOLDER_REST */

export default function CouponPopup({ popups }: { popups: CouponPopupData[] }) {
  const [activePopup, setActivePopup] = useState<CouponPopupData | null>(null)
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [couponCode, setCouponCode] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (!popups || popups.length === 0) return
    const timer = setTimeout(() => {
      if (!shouldShowCouponPopup()) return
      const coupon = popups.find(
        (p) => p.popup_type === "coupon" && p.coupon_code
      )
      if (coupon) setActivePopup(coupon)
    }, 800)
    return () => clearTimeout(timer)
  }, [popups])

  const handleClose = useCallback(() => {
    markCouponPopupShown()
    setActivePopup(null)
    setStatus("idle")
    setEmail("")
    setCouponCode("")
  }, [])

  const handleClaim = useCallback(async () => {
    if (!activePopup || !email) return
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrorMsg("请输入有效的邮箱地址")
      return
    }
    setStatus("loading")
    setErrorMsg("")
    try {
      const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
      const res = await fetch(`${backendUrl}/store/content/coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ popup_id: activePopup.id, email }),
      })
      if (!res.ok) throw new Error("领取失败")
      const data = await res.json()
      setCouponCode(data.coupon_code)
      setStatus("success")
      markCouponPopupShown()
    } catch {
      setErrorMsg("领取失败，请稍后重试")
      setStatus("error")
    }
  }, [activePopup, email])

  if (!activePopup) return null

/* PLACEHOLDER_RENDER */

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div className="relative mx-4 w-full max-w-md overflow-hidden rounded-xl bg-surface shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
          aria-label="关闭弹窗"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>

        {activePopup.image_url && (
          <div className="aspect-video w-full overflow-hidden">
            <img
              src={activePopup.image_url}
              alt={activePopup.title || "优惠券"}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          {activePopup.title && (
            <h3 className="mb-2 text-center text-lg font-bold text-gold">
              {activePopup.title}
            </h3>
          )}
          {activePopup.description && (
            <p className="mb-4 text-center text-sm text-muted">
              {activePopup.description}
            </p>
          )}

{/* PLACEHOLDER_FORM */}

          {status === "success" ? (
            <div className="text-center">
              <div className="mb-3 text-sm text-muted">领取成功！您的优惠码：</div>
              <div className="mb-4 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-center text-lg font-bold tracking-widest text-gold">
                {couponCode}
              </div>
              <p className="text-xs text-muted">请在结算时输入此优惠码使用</p>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg("") }}
                  placeholder="请输入您的邮箱"
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  disabled={status === "loading"}
                  aria-label="邮箱地址"
                />
              </div>
              {errorMsg && (
                <p className="mb-2 text-xs text-red-400">{errorMsg}</p>
              )}
              <button
                onClick={handleClaim}
                disabled={status === "loading" || !email}
                className="w-full rounded-md bg-gold px-6 py-2.5 text-sm font-semibold text-background transition hover:bg-gold-light disabled:opacity-50"
              >
                {status === "loading" ? "领取中..." : (activePopup.button_text || "立即领取")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
