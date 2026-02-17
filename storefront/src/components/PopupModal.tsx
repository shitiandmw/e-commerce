"use client"

import { useState, useEffect } from "react"

interface Popup {
  id: string
  title?: string
  description?: string
  image_url?: string
  button_text?: string
  button_link?: string
  trigger_type: "first_visit" | "every_visit" | "specific_page"
  display_frequency: "once" | "once_per_session" | "once_per_day"
  target_page?: string
}

function getStorageKey(popupId: string) {
  return `popup_dismissed_${popupId}`
}

function shouldShowPopup(popup: Popup): boolean {
  if (typeof window === "undefined") return false

  const key = getStorageKey(popup.id)

  if (popup.display_frequency === "once") {
    return !localStorage.getItem(key)
  }

  if (popup.display_frequency === "once_per_session") {
    return !sessionStorage.getItem(key)
  }

  if (popup.display_frequency === "once_per_day") {
    const last = localStorage.getItem(key)
    if (!last) return true
    const lastDate = new Date(parseInt(last, 10))
    const now = new Date()
    return lastDate.toDateString() !== now.toDateString()
  }

  return true
}

function markDismissed(popup: Popup) {
  const key = getStorageKey(popup.id)

  if (popup.display_frequency === "once") {
    localStorage.setItem(key, "1")
  } else if (popup.display_frequency === "once_per_session") {
    sessionStorage.setItem(key, "1")
  } else if (popup.display_frequency === "once_per_day") {
    localStorage.setItem(key, Date.now().toString())
  }
}

export default function PopupModal({ popups }: { popups: Popup[] }) {
  const [activePopup, setActivePopup] = useState<Popup | null>(null)

  useEffect(() => {
    if (!popups || popups.length === 0) return

    const timer = setTimeout(() => {
      for (const popup of popups) {
        if (popup.trigger_type === "first_visit" && shouldShowPopup(popup)) {
          setActivePopup(popup)
          break
        }
        if (popup.trigger_type === "every_visit" && shouldShowPopup(popup)) {
          setActivePopup(popup)
          break
        }
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [popups])

  if (!activePopup) return null

  const handleClose = () => {
    markDismissed(activePopup)
    setActivePopup(null)
  }

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
              alt={activePopup.title || "弹窗"}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          {activePopup.title && (
            <h3 className="mb-2 text-lg font-bold text-foreground">
              {activePopup.title}
            </h3>
          )}
          {activePopup.description && (
            <p className="mb-4 text-sm text-muted">
              {activePopup.description}
            </p>
          )}
          {activePopup.button_text && (
            <a
              href={activePopup.button_link || "#"}
              onClick={handleClose}
              className="inline-block rounded-md bg-gold px-6 py-2.5 text-sm font-semibold text-background transition hover:bg-gold-light"
            >
              {activePopup.button_text}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
