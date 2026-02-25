import Image from "next/image"
import { getTranslations } from "next-intl/server"

const stepKeys = ["s1", "s2", "s3", "s4", "s5", "s6"] as const
const stepNumbers = ["01", "02", "03", "04", "05", "06"] as const

export async function CraftProcess() {
  const t = await getTranslations()

  const steps = stepKeys.map((key, i) => ({
    number: stepNumbers[i],
    title: t(`bs_craft_${key}_title`),
    titleEn: t(`bs_craft_${key}_title_en`),
    description: t(`bs_craft_${key}_desc`),
  }))

  return (
    <section className="py-20 px-4 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Left: Sticky Image */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">
                {t("bs_craft_tag")}
              </p>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground text-balance">
                {t("bs_craft_title")}
              </h2>
              <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
                {t("bs_craft_desc")}
              </p>
              <div className="mt-8 relative aspect-[3/4] overflow-hidden">
                <Image
                  src="/images/torcedor.jpg"
                  alt="Torcedor"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-xs text-foreground/70 italic">
                    {t("bs_craft_image_caption")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Steps */}
          <div className="lg:col-span-3 flex flex-col gap-8">
            {steps.map((step) => (
              <div
                key={step.number}
                className="group relative p-6 border border-border/30 hover:border-gold/20 transition-colors"
              >
                <div className="flex items-start gap-5">
                  <span className="text-gold/20 font-serif text-4xl lg:text-5xl font-bold leading-none shrink-0 group-hover:text-gold/40 transition-colors">
                    {step.number}
                  </span>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-lg font-serif font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <span className="text-xs text-muted-foreground tracking-wide">
                        {step.titleEn}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
