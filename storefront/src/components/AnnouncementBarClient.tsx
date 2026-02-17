"use client"

import { useState, useEffect, useCallback } from "react"

type Announcement = {
  id: string
  text: string
  link_url: string | null
  sort_order: number
}

export default function AnnouncementBarClient({
  announcements,
}: {
  announcements: Announcement[]
}) {
  const [visible, setVisible] = useState(true)
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % announcements.length)
  }, [announcements.length])

  // Auto-rotate every 4 seconds when multiple announcements
  useEffect(() => {
    if (announcements.length <= 1) return
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [announcements.length, next])

  if (!visible) return null

  const item = announcements[current]

  return (
    <div className="relative bg-gold text-background">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-8 py-2">
        {/* Left arrow for manual navigation */}
        {announcements.length > 1 && (
          <button
            onClick={() => setCurrent((prev) => (prev - 1 + announcements.length) % announcements.length)}
            className="absolute left-2 text-background/70 hover:text-background"
            aria-label="上一条公告"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}

        {/* Announcement text */}
        <div className="text-center text-sm font-medium">
          {item.link_url ? (
            <a href={item.link_url} className="underline-offset-2 hover:underline">
              {item.text}
            </a>
          ) : (
            <span>{item.text}</span>
          )}
          {/* Dots indicator */}
          {announcements.length > 1 && (
            <span className="ml-3 inline-flex gap-1">
              {announcements.map((_, i) => (
                <span
                  key={i}
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    i === current ? "bg-background" : "bg-background/40"
                  }`}
                />
              ))}
            </span>
          )}
        </div>

        {/* Right arrow */}
        {announcements.length > 1 && (
          <button
            onClick={next}
            className="absolute right-8 text-background/70 hover:text-background"
            aria-label="下一条公告"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        )}

        {/* Close button */}
        <button
          onClick={() => setVisible(false)}
          className="absolute right-2 text-background/70 hover:text-background"
          aria-label="关闭公告栏"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
