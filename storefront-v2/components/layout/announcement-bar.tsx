"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Announcement {
  id: string
  text: string
  link_url?: string | null
}

export function AnnouncementBarClient({ announcements }: { announcements: Announcement[] }) {
  const [dismissed, setDismissed] = useState(false)
  const [current, setCurrent] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const pathname = usePathname()
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  const count = announcements.length
  const isCheckout = pathname.startsWith("/checkout")

  const next = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % count)
      setIsAnimating(false)
    }, 300)
  }, [isAnimating, count])

  useEffect(() => {
    if (count <= 1) return
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [count, next])

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [])

  if (dismissed || count === 0 || isCheckout) return null

  const item = announcements[current]

  const renderContent = (a: Announcement) => {
    const text = <span className="text-xs tracking-wider">{a.text}</span>
    return a.link_url ? (
      <Link href={a.link_url} className="hover:underline underline-offset-2">
        {text}
      </Link>
    ) : text
  }

  return (
    <div className="bg-gold/90 text-primary-foreground relative flex items-center justify-center px-8 py-1.5 overflow-hidden">
      <div
        key={item.id}
        className={cn(
          "transition-all duration-300 ease-in-out",
          isAnimating
            ? "opacity-0 -translate-y-2"
            : "opacity-100 translate-y-0"
        )}
      >
        {renderContent(item)}
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-foreground/50 hover:text-primary-foreground transition-colors"
        aria-label="關閉公告"
      >
        <X className="size-3" />
      </button>
    </div>
  )
}
