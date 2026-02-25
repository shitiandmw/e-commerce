"use client"

import { useState } from "react"
import { Link } from "@/i18n/navigation"
import { ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"

interface BrandInfo {
  nameKey: string
  nameEn: string
  slug: string
  founded: string
  descKey: string
  strengthKey: string
  signature: string
  tier: "premium" | "classic" | "entry"
}

const brands: BrandInfo[] = [
  { nameKey: "cohiba", nameEn: "Cohiba", slug: "cohiba", founded: "1966", signature: "Siglo VI / Behike 56", tier: "premium", descKey: "cohiba", strengthKey: "cohiba" },
  { nameKey: "montecristo", nameEn: "Montecristo", slug: "montecristo", founded: "1935", signature: "No.2 / Edmundo", tier: "premium", descKey: "montecristo", strengthKey: "montecristo" },
  { nameKey: "partagas", nameEn: "Partagas", slug: "partagas", founded: "1845", signature: "Serie D No.4 / Lusitania", tier: "premium", descKey: "partagas", strengthKey: "partagas" },
  { nameKey: "romeo", nameEn: "Romeo y Julieta", slug: "romeo-y-julieta", founded: "1875", signature: "Wide Churchill / Short Churchill", tier: "classic", descKey: "romeo", strengthKey: "romeo" },
  { nameKey: "hoyo", nameEn: "Hoyo de Monterrey", slug: "hoyo", founded: "1865", signature: "Epicure No.2 / Epicure Especial", tier: "classic", descKey: "hoyo", strengthKey: "hoyo" },
  { nameKey: "bolivar", nameEn: "Bolivar", slug: "bolivar", founded: "1902", signature: "Belicosos Finos / Royal Corona", tier: "classic", descKey: "bolivar", strengthKey: "bolivar" },
  { nameKey: "trinidad", nameEn: "Trinidad", slug: "trinidad", founded: "1969", signature: "Fundadores / Vigia", tier: "premium", descKey: "trinidad", strengthKey: "trinidad" },
  { nameKey: "upmann", nameEn: "H. Upmann", slug: "h-upmann", founded: "1844", signature: "Magnum 46 / No.2", tier: "classic", descKey: "upmann", strengthKey: "upmann" },
  { nameKey: "punch", nameEn: "Punch", slug: "punch", founded: "1840", signature: "Punch Punch / Double Corona", tier: "entry", descKey: "punch", strengthKey: "punch" },
]

const tierFilterKeys = [
  { key: "all", labelKey: "bs_brands_filter_all" },
  { key: "premium", labelKey: "bs_brands_filter_premium" },
  { key: "classic", labelKey: "bs_brands_filter_classic" },
  { key: "entry", labelKey: "bs_brands_filter_entry" },
] as const

export function BrandShowcase() {
  const t = useTranslations()
  const [activeTier, setActiveTier] = useState<string>("all")

  const filteredBrands =
    activeTier === "all"
      ? brands
      : brands.filter((b) => b.tier === activeTier)

  return (
    <section className="py-20 px-4 lg:px-6 bg-card">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">
            {t("bs_brands_tag")}
          </p>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
            {t("bs_brands_title")}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
            {t("bs_brands_desc")}
          </p>
        </div>

        {/* Tier Filter */}
        <div className="flex justify-center gap-2 mb-10 flex-wrap">
          {tierFilterKeys.map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => setActiveTier(key)}
              className={`px-4 py-2 text-xs tracking-wide transition-colors border ${
                activeTier === key
                  ? "border-gold text-gold bg-gold/10"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {/* Brand Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBrands.map((brand) => (
            <div
              key={brand.slug}
              className="group p-6 border border-border/30 hover:border-gold/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-serif font-bold text-foreground group-hover:text-gold transition-colors">
                    {t(`bs_brand_${brand.nameKey}`)}
                  </h3>
                  <p className="text-xs text-muted-foreground tracking-wide">
                    {brand.nameEn}
                  </p>
                </div>
                <span className="text-gold/30 font-serif text-2xl font-bold leading-none">
                  {brand.founded}
                </span>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {t(`bs_brand_${brand.descKey}_desc`)}
              </p>

              <div className="flex flex-col gap-2 pt-4 border-t border-border/20">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t("bs_brands_strength")}</span>
                  <span className="text-foreground">{t(`bs_brand_${brand.strengthKey}_strength`)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t("bs_brands_signature")}</span>
                  <span className="text-foreground">{brand.signature}</span>
                </div>
              </div>

              {/* TODO: 待分类页品牌筛选完成后启用
              <Link
                href={`/category/cuban-cigars?brand=${brand.slug}`}
                className="mt-5 flex items-center gap-1.5 text-xs text-gold hover:text-gold-light transition-colors"
              >
                {t("bs_brands_explore", { name: t(`bs_brand_${brand.nameKey}`) })}{" "}
                <ArrowRight className="size-3" />
              </Link>
              */}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
