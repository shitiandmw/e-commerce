"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const slides = [
  {
    image: "/images/hero-1.jpg",
    title: "高端雪茄的完美詮釋",
    subtitle: "探索古巴頂級雪茄系列",
    cta: "立即選購",
    href: "/category/cuban-cigars",
  },
  {
    image: "/images/hero-2.jpg",
    title: "2025 限量珍藏版",
    subtitle: "全球限量發售，搶先體驗",
    cta: "探索限量版",
    href: "/category/cuban-cigars",
  },
  {
    image: "/images/hero-3.jpg",
    title: "品味生活，從一支好茄開始",
    subtitle: "為您嚴選世界各地頂級雪茄",
    cta: "瀏覽全部",
    href: "/category/world-cigars",
  },
]

export function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    const interval = setInterval(() => emblaApi.scrollNext(), 5000)
    return () => {
      emblaApi.off("select", onSelect)
      clearInterval(interval)
    }
  }, [emblaApi, onSelect])

  return (
    <section className="relative" aria-label="精選輪播">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide, i) => (
            <div key={i} className="min-w-0 shrink-0 grow-0 basis-full relative">
              <div className="relative h-[60vh] md:h-[75vh] lg:h-[85vh]">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  priority={i === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
                <div className="absolute inset-0 flex items-center">
                  <div className="mx-auto w-full max-w-7xl px-4 lg:px-6">
                    <div className="max-w-lg">
                      <p className="text-gold text-sm tracking-[0.3em] uppercase mb-3 font-medium">
                        TimeCigar
                      </p>
                      <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-tight text-balance">
                        {slide.title}
                      </h1>
                      <p className="mt-4 text-base md:text-lg text-foreground/70 leading-relaxed">
                        {slide.subtitle}
                      </p>
                      <Link
                        href={slide.href}
                        className="mt-8 inline-flex items-center gap-2 bg-gold text-primary-foreground px-8 py-3 text-sm font-medium tracking-wide hover:bg-gold-dark transition-colors"
                      >
                        {slide.cta}
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 size-10 flex items-center justify-center bg-background/30 hover:bg-background/50 text-foreground/70 hover:text-foreground backdrop-blur-sm transition-all"
        aria-label="上一張"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 size-10 flex items-center justify-center bg-background/30 hover:bg-background/50 text-foreground/70 hover:text-foreground backdrop-blur-sm transition-all"
        aria-label="下一張"
      >
        <ChevronRight className="size-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={cn(
              "h-0.5 transition-all duration-300",
              selectedIndex === i ? "w-8 bg-gold" : "w-4 bg-foreground/30"
            )}
            aria-label={`前往第 ${i + 1} 張`}
          />
        ))}
      </div>
    </section>
  )
}
