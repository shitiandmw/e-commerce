"use client"

import { useState, useEffect, useCallback } from "react"

interface BannerItem {
  id: string
  image_url: string
  title?: string
  subtitle?: string
  link_url?: string
  sort_order: number
}

interface BannerSlot {
  id: string
  name: string
  key: string
  items: BannerItem[]
}

export default function HeroBanner({ banners }: { banners: BannerSlot[] }) {
  const items = banners.flatMap((slot) => slot.items)
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const showControls = items.length > 1

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % items.length)
  }, [items.length])

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + items.length) % items.length)
  }, [items.length])

  useEffect(() => {
    if (!showControls || paused) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [showControls, paused, next])

  if (items.length === 0) return null

  const item = items[current]
  const Wrapper = item.link_url ? "a" : "div"
  const wrapperProps = item.link_url
    ? { href: item.link_url, target: "_blank" as const, rel: "noopener noreferrer" }
    : {}

  return (
    <section
      className="relative w-full overflow-hidden bg-surface"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Wrapper
        {...wrapperProps}
        className="relative block aspect-[21/9] w-full md:aspect-[21/7]"
      >
        <img
          src={item.image_url}
          alt={item.title || "Banner"}
          className="h-full w-full object-cover"
        />
        {(item.title || item.subtitle) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 px-4 text-center">
            {item.title && (
              <h2 className="mb-2 text-2xl font-bold text-white md:text-4xl">
                {item.title}
              </h2>
            )}
            {item.subtitle && (
              <p className="text-sm text-white/90 md:text-lg">{item.subtitle}</p>
            )}
          </div>
        )}
      </Wrapper>

      {showControls && (
        <>
          <button
            onClick={prev}
            aria-label="上一张"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white transition hover:bg-black/60"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="下一张"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white transition hover:bg-black/60"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`切换到第 ${i + 1} 张`}
                className={`h-2 rounded-full transition-all ${
                  i === current ? "w-6 bg-gold" : "w-2 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
