import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

export async function BrandStoryCTA() {
  const t = await getTranslations()
  return (
    <section className="py-20 px-4 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden">
          <div className="relative h-[400px] lg:h-[450px]">
            <Image
              src="/images/aging-room.jpg"
              alt={t("bs_cta_title")}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-lg px-8 lg:px-12">
                <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">
                  {t("bs_cta_tag")}
                </p>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight text-balance">
                  {t("bs_cta_title")}
                </h2>
                <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
                  {t("bs_cta_desc")}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  {/* TODO: 待对应页面就绪后启用
                  <Link
                    href="/category/cuban-cigars"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm bg-gold text-primary-foreground hover:bg-gold-light transition-colors tracking-wide font-medium"
                  >
                    {t("bs_cta_explore")}
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="/articles/guide-to-cuban-cigars"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm border border-gold/30 text-gold hover:border-gold/60 transition-colors tracking-wide"
                  >
                    {t("bs_cta_guide")}
                  </Link>
                  */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
