import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

export async function BrandSpotlight() {
  const t = await getTranslations()
  return (
    <section className="py-16 px-4 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden">
          <div className="relative h-[500px] lg:h-[600px]">
            <Image
              src="/images/brand-story.jpg"
              alt={t("brand_story_title")}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-lg px-8 lg:px-12">
                <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">{t("brand_story_subtitle")}</p>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight text-balance">
                  {t("brand_story_title")}
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  {t("brand_story_desc")}
                </p>
                <div className="mt-6 flex flex-col gap-2 text-sm text-foreground/60">
                  <div className="flex items-center gap-4">
                    <span className="text-gold font-serif text-2xl font-bold">27</span>
                    <span>{t("brand_story_stat1_label")}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gold font-serif text-2xl font-bold">500+</span>
                    <span>{t("brand_story_stat2_label")}</span>
                  </div>
                </div>
                <Link
                  href="/brand-story"
                  className="mt-8 inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors tracking-wide"
                >
                  {t("brand_story_link")} <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
