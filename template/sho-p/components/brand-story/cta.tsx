import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function BrandStoryCTA() {
  return (
    <section className="py-20 px-4 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden">
          <div className="relative h-[400px] lg:h-[450px]">
            <Image
              src="/images/aging-room.jpg"
              alt="雪茄陳放室"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-lg px-8 lg:px-12">
                <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">
                  Explore Collection
                </p>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight text-balance">
                  品鑑古巴的靈魂
                </h2>
                <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
                  了解了古巴製茄的百年傳承，是時候親身品鑑這份來自加勒比海的禮物。從經典的蒙特克里斯托二號到珍稀的高希霸 Behike，在 TimeCigar 找到屬於您的那一支。
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/category/cuban-cigars"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm bg-gold text-primary-foreground hover:bg-gold-light transition-colors tracking-wide font-medium"
                  >
                    探索古巴雪茄
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="/articles/guide-to-cuban-cigars"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm border border-gold/30 text-gold hover:border-gold/60 transition-colors tracking-wide"
                  >
                    入門選購指南
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
