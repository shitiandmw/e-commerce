import { getTranslations } from "next-intl/server"

const milestoneKeys = ["1", "2", "3", "4", "5", "6", "7"] as const

export async function HistoryTimeline() {
  const t = await getTranslations()

  const milestones = milestoneKeys.map((key) => ({
    year: t(`bs_history_${key}_year`),
    title: t(`bs_history_${key}_title`),
    description: t(`bs_history_${key}_desc`),
  }))

  return (
    <section className="py-20 px-4 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">
            {t("bs_history_tag")}
          </p>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
            {t("bs_history_title")}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
            {t("bs_history_desc")}
          </p>
        </div>

        <div className="relative">
          {/* Center line */}
          <div className="absolute left-4 lg:left-1/2 top-0 bottom-0 w-px bg-border/50 lg:-translate-x-px" />

          <div className="flex flex-col gap-12 lg:gap-16">
            {milestones.map((milestone, index) => (
              <div
                key={milestone.year}
                className={`relative flex flex-col lg:flex-row ${
                  index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                } items-start lg:items-center`}
              >
                {/* Year dot */}
                <div className="absolute left-4 lg:left-1/2 -translate-x-1/2 flex items-center justify-center z-10">
                  <div className="size-3 rounded-full bg-gold border-2 border-background" />
                </div>

                {/* Content */}
                <div
                  className={`ml-12 lg:ml-0 lg:w-1/2 ${
                    index % 2 === 0 ? "lg:pr-16 lg:text-right" : "lg:pl-16 lg:text-left"
                  }`}
                >
                  <span className="text-gold font-serif text-2xl lg:text-3xl font-bold">
                    {milestone.year}
                  </span>
                  <h3 className="mt-2 text-lg font-serif font-semibold text-foreground">
                    {milestone.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {milestone.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
