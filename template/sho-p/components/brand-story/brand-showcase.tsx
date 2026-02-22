"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface BrandInfo {
  name: string
  nameEn: string
  slug: string
  founded: string
  strength: string
  description: string
  signature: string
  tier: "premium" | "classic" | "entry"
}

const brands: BrandInfo[] = [
  {
    name: "高希霸",
    nameEn: "Cohiba",
    slug: "cohiba",
    founded: "1966",
    strength: "中至強",
    description:
      "古巴雪茄的王者，最初僅供古巴領導人享用。以獨特的三重發酵工藝聞名，Behike 系列更是雪茄界的聖杯。",
    signature: "Siglo VI / Behike 56",
    tier: "premium",
  },
  {
    name: "蒙特克里斯托",
    nameEn: "Montecristo",
    slug: "montecristo",
    founded: "1935",
    strength: "中至中強",
    description:
      "全球銷量最高的古巴雪茄品牌，以均衡的風味和穩定的品質贏得了無數愛好者的心。No.2 是世界上最著名的魚雷型雪茄。",
    signature: "No.2 / Edmundo",
    tier: "premium",
  },
  {
    name: "帕特加斯",
    nameEn: "Partagas",
    slug: "partagas",
    founded: "1845",
    strength: "中強至強",
    description:
      "古巴歷史最悠久的雪茄品牌之一，以強勁飽滿的風味著稱。Serie D No.4 是最受歡迎的 Robusto 型號之一。",
    signature: "Serie D No.4 / Lusitania",
    tier: "premium",
  },
  {
    name: "羅密歐與朱麗葉",
    nameEn: "Romeo y Julieta",
    slug: "romeo-y-julieta",
    founded: "1875",
    strength: "輕至中",
    description:
      "以莎士比亞名劇命名，一直是英國首相邱吉爾的最愛。Churchill 型號因此得名，Wide Churchill 是近年最成功的新品。",
    signature: "Wide Churchill / Short Churchill",
    tier: "classic",
  },
  {
    name: "荷約·蒙特雷",
    nameEn: "Hoyo de Monterrey",
    slug: "hoyo",
    founded: "1865",
    strength: "輕至中",
    description:
      "風味優雅柔順的品牌，Epicure 系列是入門者和資深品鑑者共同鍾愛的選擇。No.2 被譽為最完美的 Robusto。",
    signature: "Epicure No.2 / Epicure Especial",
    tier: "classic",
  },
  {
    name: "玻利瓦爾",
    nameEn: "Bolivar",
    slug: "bolivar",
    founded: "1902",
    strength: "強",
    description:
      "以南美解放者西蒙·玻利瓦爾命名，是古巴風味最強勁的品牌之一。Belicosos Finos 是其最具代表性的型號。",
    signature: "Belicosos Finos / Royal Corona",
    tier: "classic",
  },
  {
    name: "千里達",
    nameEn: "Trinidad",
    slug: "trinidad",
    founded: "1969",
    strength: "中",
    description:
      "曾與 Cohiba 一樣作為外交禮品使用，1998 年才正式向公眾發售。以其優雅細膩的風味和精緻的外觀聞名。",
    signature: "Fundadores / Vigia",
    tier: "premium",
  },
  {
    name: "優名",
    nameEn: "H. Upmann",
    slug: "h-upmann",
    founded: "1844",
    strength: "輕至中",
    description:
      "由德國銀行家創立的傳奇品牌，以精緻優雅的中輕度風味見長。Magnum 46 和 50 系列是近年最受追捧的型號。",
    signature: "Magnum 46 / No.2",
    tier: "classic",
  },
  {
    name: "潘趣",
    nameEn: "Punch",
    slug: "punch",
    founded: "1840",
    strength: "中至中強",
    description:
      "品牌名源於英國幽默雜誌《Punch》，是古巴最古老的品牌之一。Punch Punch 是其標誌性型號。",
    signature: "Punch Punch / Double Corona",
    tier: "entry",
  },
]

const tierLabels: Record<string, string> = {
  all: "全部品牌",
  premium: "頂級系列",
  classic: "經典品牌",
  entry: "入門之選",
}

export function BrandShowcase() {
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
            Brands
          </p>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
            經典品牌巡禮
          </h2>
          <p className="mt-3 text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
            27 個古巴雪茄品牌，每一個都有其獨特的風格與靈魂
          </p>
        </div>

        {/* Tier Filter */}
        <div className="flex justify-center gap-2 mb-10 flex-wrap">
          {Object.entries(tierLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTier(key)}
              className={`px-4 py-2 text-xs tracking-wide transition-colors border ${
                activeTier === key
                  ? "border-gold text-gold bg-gold/10"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {label}
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
                    {brand.name}
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
                {brand.description}
              </p>

              <div className="flex flex-col gap-2 pt-4 border-t border-border/20">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">強度</span>
                  <span className="text-foreground">{brand.strength}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">代表作</span>
                  <span className="text-foreground">{brand.signature}</span>
                </div>
              </div>

              <Link
                href={`/category/cuban-cigars?brand=${brand.slug}`}
                className="mt-5 flex items-center gap-1.5 text-xs text-gold hover:text-gold-light transition-colors"
              >
                探索{brand.name}系列{" "}
                <ArrowRight className="size-3" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
