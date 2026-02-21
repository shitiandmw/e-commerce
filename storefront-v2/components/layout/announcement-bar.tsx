"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

interface Announcement {
  id: string
  text: string
  link_url?: string | null
}

export function AnnouncementBarClient({ announcements }: { announcements: Announcement[] }) {
  const [dismissed, setDismissed] = useState(false)
  const [current, setCurrent] = useState(0)
  const pathname = usePathname()

  const count = announcements.length
  const isCheckout = pathname.startsWith("/checkout")

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % count)
  }, [count])

  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + count) % count)
  }, [count])

  // Auto-rotate when multiple announcements
  useEffect(() => {
    if (count <= 1) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [count, next])

  if (dismissed || count === 0 || isCheckout) return null

  const item = announcements[current]

  const content = (
    <span className="text-xs tracking-wider">{item.text}</span>
  )

  return (
    <div className="bg-gold/90 text-primary-foreground relative flex items-center justify-center px-10 py-2">
      {/* Navigation arrows for multiple announcements */}
      {count > 1 && (
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          aria-label="上一條公告"
        >
          <ChevronLeft className="size-3.5" />
        </button>
      )}

      {item.link_url ? (
        <Link href={item.link_url} className="hover:underline underline-offset-2">
          {content}
        </Link>
      ) : (
        content
      )}

      {count > 1 && (
        <button
          onClick={next}
          className="absolute right-10 top-1/2 -translate-y-1/2 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          aria-label="下一條公告"
        >
          <ChevronRight className="size-3.5" />
        </button>
      )}

      {/* Close button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
        aria-label="關閉公告"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
