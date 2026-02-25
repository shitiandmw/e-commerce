import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { ChevronRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

export async function BrandStoryHero() {
  const t = await getTranslations()
  return (
    <section className="relative h-[70vh] min-h-[500px] lg:h-[80vh]">
      <Image
        src="/images/brand-story-hero.jpg"
        alt={t("bs_hero_title")}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />

      {/* Breadcrumb */}
      <nav
        className="absolute top-0 left-0 right-0 mx-auto max-w-7xl px-4 py-4 lg:px-6 z-10"
        aria-label="breadcrumb"
      >
        <ol className="flex items-center gap-1.5 text-xs text-foreground/50">
          <li>
            <Link href="/" className="hover:text-gold transition-colors">
              {t("bs_breadcrumb_home")}
            </Link>
          </li>
          <li>
            <ChevronRight className="size-3" />
          </li>
          <li className="text-foreground/70">{t("bs_breadcrumb_brand_story")}</li>
        </ol>
      </nav>

      {/* Hero Content */}
      <div className="absolute inset-0 flex items-end">
        <div className="mx-auto max-w-7xl w-full px-4 lg:px-6 pb-16 lg:pb-20">
          <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">
            {t("bs_hero_tag")}
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-tight max-w-2xl text-balance">
            {t("bs_hero_title")}
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl text-pretty">
            {t("bs_hero_desc")}
          </p>
          <div className="mt-8 flex items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="text-gold font-serif text-3xl lg:text-4xl font-bold">
                {t("bs_hero_stat1_value")}
              </span>
              <span className="text-sm text-foreground/60 leading-tight">
                {t("bs_hero_stat1_line1")}
                <br />
                {t("bs_hero_stat1_line2")}
              </span>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <div className="flex items-center gap-3">
              <span className="text-gold font-serif text-3xl lg:text-4xl font-bold">
                {t("bs_hero_stat2_value")}
              </span>
              <span className="text-sm text-foreground/60 leading-tight">
                {t("bs_hero_stat2_line1")}
                <br />
                {t("bs_hero_stat2_line2")}
              </span>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <div className="flex items-center gap-3">
              <span className="text-gold font-serif text-3xl lg:text-4xl font-bold">
                {t("bs_hero_stat3_value")}
              </span>
              <span className="text-sm text-foreground/60 leading-tight">
                {t("bs_hero_stat3_line1")}
                <br />
                {t("bs_hero_stat3_line2")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
