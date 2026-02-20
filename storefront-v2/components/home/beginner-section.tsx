import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function BeginnerSection() {
  return (
    <section className="py-16 px-4 lg:px-6 bg-card">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-0 items-stretch overflow-hidden border border-border/30">
          {/* Image */}
          <div className="relative h-64 lg:h-auto min-h-[400px]">
            <Image
              src="/images/hero-3.jpg"
              alt="新手入門"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/20 lg:bg-none" />
          </div>

          {/* Content */}
          <div className="flex flex-col justify-center p-8 lg:p-12 bg-surface-elevated">
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">For Beginners</p>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight text-balance">
              新手入門指南
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              不知道如何選擇第一支雪茄？讓我們為您推薦最適合入門的雪茄系列。從輕度到中度，從迷你到標準尺寸，找到屬於您的第一支好茄。
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {[
                "專業選茄指南，根據口味偏好推薦",
                "新手友好的輕度至中度雪茄系列",
                "完整的雪茄品鑑教學與搭配建議",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                  <span className="mt-1 flex size-5 shrink-0 items-center justify-center bg-gold/10 text-gold text-[10px]">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/articles/beginner-first-cigar"
                className="inline-flex items-center gap-2 bg-gold text-primary-foreground px-6 py-3 text-sm font-medium tracking-wide hover:bg-gold-dark transition-colors"
              >
                閱讀指南 <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/category/mini-cigars"
                className="inline-flex items-center gap-2 border border-border text-foreground/70 px-6 py-3 text-sm tracking-wide hover:border-gold hover:text-gold transition-colors"
              >
                入門推薦
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
