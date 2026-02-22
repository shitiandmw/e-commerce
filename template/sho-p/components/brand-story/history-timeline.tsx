const milestones = [
  {
    year: "1492",
    title: "菸草的發現",
    description:
      "哥倫布的船員在古巴首次見到當地原住民泰諾族（Taino）吸食捲起的菸葉，這是歐洲人對菸草的最早記錄。",
  },
  {
    year: "1542",
    title: "菸草種植的興起",
    description:
      "西班牙殖民者開始在古巴大規模種植菸草，古巴獨特的紅土壤和溫潤氣候被證明是種植頂級菸葉的理想條件。",
  },
  {
    year: "1810s",
    title: "品牌時代開啟",
    description:
      "帕特加斯（Partagas, 1845）、好友（Hoyo de Monterrey, 1865）、羅密歐與朱麗葉（Romeo y Julieta, 1875）等傳奇品牌相繼創立，古巴雪茄的黃金時代拉開序幕。",
  },
  {
    year: "1907",
    title: "原產地保護",
    description:
      "古巴政府開始對菸草產區實施原產地命名保護，確保「Habanos」的品質和正統性，Vuelta Abajo 被正式認定為最優質的菸草產區。",
  },
  {
    year: "1966",
    title: "高希霸的誕生",
    description:
      "Cohiba 品牌誕生，最初僅作為古巴領導人的私人雪茄供應。其獨特的三重發酵工藝成為古巴雪茄工藝的巔峰象徵。",
  },
  {
    year: "1994",
    title: "Habanos S.A. 成立",
    description:
      "古巴成立了 Habanos S.A. 作為古巴雪茄的全球獨家分銷商，統一管理所有古巴雪茄品牌的生產與銷售。",
  },
  {
    year: "至今",
    title: "傳承與創新",
    description:
      "古巴雪茄繼續堅持全手工製作的傳統，同時不斷推出限量版和特別版，將百年工藝與現代品味完美融合。每年的 Habanos Festival 更成為全球雪茄愛好者的朝聖之旅。",
  },
]

export function HistoryTimeline() {
  return (
    <section className="py-20 px-4 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">
            History
          </p>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
            五百年的傳奇歷程
          </h2>
          <p className="mt-3 text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
            從一片菸葉到一個傳奇，古巴雪茄的故事跨越了五個世紀
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
                  index % 2 === 0
                    ? "lg:flex-row"
                    : "lg:flex-row-reverse"
                } items-start lg:items-center`}
              >
                {/* Year dot */}
                <div className="absolute left-4 lg:left-1/2 -translate-x-1/2 flex items-center justify-center z-10">
                  <div className="size-3 rounded-full bg-gold border-2 border-background" />
                </div>

                {/* Content */}
                <div
                  className={`ml-12 lg:ml-0 lg:w-1/2 ${
                    index % 2 === 0
                      ? "lg:pr-16 lg:text-right"
                      : "lg:pl-16 lg:text-left"
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
