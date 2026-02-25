import Image from "next/image"
import { getTranslations } from "next-intl/server"

const regionKeys = ["r1", "r2", "r3", "r4", "r5"] as const

export async function VueltaAbajo() {
  const t = await getTranslations()

  const regions = regionKeys.map((key, i) => ({
    name: t(`bs_terroir_${key}_name`),
    nameZh: t(`bs_terroir_${key}_name_zh`),
    description: t(`bs_terroir_${key}_desc`),
    highlight: i === 0,
  }))

  return (
    <section className="py-20 px-4 lg:px-6 bg-card">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src="/images/vuelta-abajo.jpg"
              alt="Vuelta Abajo"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-gold text-xs tracking-[0.2em] uppercase">
                Pinar del Rio, Cuba
              </p>
              <p className="mt-1 text-sm text-foreground/80">
                {t("bs_terroir_image_caption")}
              </p>
            </div>
          </div>

          {/* Content */}
          <div>
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">
              {t("bs_terroir_tag")}
            </p>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground text-balance">
              {t("bs_terroir_title")}
            </h2>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
              {t("bs_terroir_desc")}
            </p>

            <div className="mt-8 flex flex-col gap-4">
              {regions.map((region) => (
                <div
                  key={region.name}
                  className={`p-4 border transition-colors ${
                    region.highlight
                      ? "border-gold/30 bg-gold/5"
                      : "border-border/30 hover:border-border/60"
                  }`}
                >
                  <div className="flex items-baseline gap-2">
                    <h3
                      className={`font-serif font-semibold ${
                        region.highlight ? "text-gold" : "text-foreground"
                      }`}
                    >
                      {region.name}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {region.nameZh}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    {region.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
