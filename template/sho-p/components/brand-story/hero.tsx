import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export function BrandStoryHero() {
  return (
    <section className="relative h-[70vh] min-h-[500px] lg:h-[80vh]">
      <Image
        src="/images/brand-story-hero.jpg"
        alt="古巴製茄工坊"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

      {/* Breadcrumb */}
      <nav
        className="absolute top-0 left-0 right-0 mx-auto max-w-7xl px-4 py-4 lg:px-6 z-10"
        aria-label="麵包屑導航"
      >
        <ol className="flex items-center gap-1.5 text-xs text-white/50">
          <li>
            <Link href="/" className="hover:text-gold transition-colors">
              首頁
            </Link>
          </li>
          <li>
            <ChevronRight className="size-3" />
          </li>
          <li className="text-white/70">品牌故事</li>
        </ol>
      </nav>

      {/* Hero Content */}
      <div className="absolute inset-0 flex items-end">
        <div className="mx-auto max-w-7xl w-full px-4 lg:px-6 pb-16 lg:pb-20">
          <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">
            Brand Heritage
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight max-w-2xl text-balance">
            古巴製茄的百年傳承
          </h1>
          <p className="mt-4 text-white/70 leading-relaxed max-w-xl text-pretty">
            從哥倫布踏上新大陸的那一刻起，古巴菸草便開啟了五百多年的傳奇篇章。每一支古巴雪茄，都是大地精華與匠人靈魂的完美結合。
          </p>
          <div className="mt-8 flex items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="text-gold font-serif text-3xl lg:text-4xl font-bold">
                500+
              </span>
              <span className="text-sm text-white/60 leading-tight">
                年菸草
                <br />
                種植歷史
              </span>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="flex items-center gap-3">
              <span className="text-gold font-serif text-3xl lg:text-4xl font-bold">
                27
              </span>
              <span className="text-sm text-white/60 leading-tight">
                個活躍
                <br />
                雪茄品牌
              </span>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="flex items-center gap-3">
              <span className="text-gold font-serif text-3xl lg:text-4xl font-bold">
                5
              </span>
              <span className="text-sm text-white/60 leading-tight">
                大經典
                <br />
                產區
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
