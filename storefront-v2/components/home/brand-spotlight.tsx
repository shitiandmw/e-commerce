import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function BrandSpotlight() {
  return (
    <section className="py-16 px-4 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden">
          <div className="relative h-[500px] lg:h-[600px]">
            <Image
              src="/images/brand-story.jpg"
              alt="品牌故事"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-lg px-8 lg:px-12">
                <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">Brand Story</p>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight text-balance">
                  古巴製茄的百年傳承
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  從Vuelta Abajo的肥沃土壤到哈瓦那的製茄工坊，每一支古巴雪茄都承載著幾代人的智慧與熱情。了解這些傳奇品牌背後的故事，感受真正的古巴靈魂。
                </p>
                <div className="mt-6 flex flex-col gap-2 text-sm text-foreground/60">
                  <div className="flex items-center gap-4">
                    <span className="text-gold font-serif text-2xl font-bold">27</span>
                    <span>個活躍古巴雪茄品牌</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gold font-serif text-2xl font-bold">500+</span>
                    <span>年的菸草種植歷史</span>
                  </div>
                </div>
                <Link
                  href="/articles/guide-to-cuban-cigars"
                  className="mt-8 inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors tracking-wide"
                >
                  探索品牌故事 <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
