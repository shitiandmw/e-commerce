"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { Link } from "@/i18n/navigation"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

interface BannerSlide {
  id: string
  image_url: string
  title?: string | null
  subtitle?: string | null
  link_url?: string | null
  cta_text?: string | null
}

interface HeroCarouselProps {
  slides?: BannerSlide[]
}

export function HeroCarousel({ slides = [] }: HeroCarouselProps) {
  const t = useTranslations()
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

  if (slides.length === 0) return null

  return (
    <section className="relative" aria-label={t("hero_carousel_label")}>
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide, i) => (
            <div key={slide.id} className="min-w-0 shrink-0 grow-0 basis-full relative">
              <div className="relative h-[60vh] md:h-[75vh] lg:h-[85vh]">
                <Image
                  src={slide.image_url}
                  alt={slide.title || "Banner"}
                  fill
                  className="object-cover"
                  priority={i === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent dark:from-background/90 dark:via-background/50 dark:to-transparent" />
                <div className="absolute inset-0 flex items-center">
                  <div className="mx-auto w-full max-w-7xl px-4 lg:px-6">
                    <div className="max-w-lg">
                      <p className="text-gold text-sm tracking-[0.3em] uppercase mb-3 font-medium">
                        ShangJia
                      </p>
                      {slide.title && (
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-tight text-balance">
                          {slide.title}
                        </h1>
                      )}
                      {slide.subtitle && (
                        <p className="mt-4 text-base md:text-lg text-foreground/70 leading-relaxed">
                          {slide.subtitle}
                        </p>
                      )}
                      {slide.link_url && (
                        <Link
                          href={slide.link_url}
                          className="mt-8 inline-flex items-center gap-2 bg-gold text-primary-foreground px-8 py-3 text-sm font-medium tracking-wide hover:bg-gold-dark transition-colors"
                        >
                          {slide.cta_text || t("hero_learn_more")}
                          <ArrowRight className="size-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          {/* Navigation arrows */}
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 size-10 flex items-center justify-center bg-black/20 hover:bg-black/30 dark:bg-background/30 dark:hover:bg-background/50 text-foreground/70 hover:text-foreground backdrop-blur-sm transition-all"
            aria-label={t("hero_prev_slide")}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 size-10 flex items-center justify-center bg-black/20 hover:bg-black/30 dark:bg-background/30 dark:hover:bg-background/50 text-foreground/70 hover:text-foreground backdrop-blur-sm transition-all"
            aria-label={t("hero_next_slide")}
          >
            <ChevronRight className="size-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => emblaApi?.scrollTo(i)}
                className={cn(
                  "h-0.5 transition-all duration-300",
                  selectedIndex === i ? "w-8 bg-gold" : "w-4 bg-foreground/30"
                )}
                aria-label={t("hero_go_to_slide", { num: i + 1 })}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
