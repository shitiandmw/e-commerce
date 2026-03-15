import Image from "next/image"

const steps = [
  {
    number: "01",
    title: "種植與收穫",
    titleEn: "Cultivation",
    description:
      "菸草種植始於每年十月，經過約 120 天的精心照料後收穫。古巴的 Vegueros（菸農）世代相傳種植技術，從選種、育苗到遮蔭控制，每一步都凝聚著深厚的經驗。",
  },
  {
    number: "02",
    title: "風乾與發酵",
    titleEn: "Curing & Fermentation",
    description:
      "收穫後的菸葉在 Casa de Tabaco（晾曬棚）中自然風乾 45-60 天，然後進入多輪發酵過程。高希霸（Cohiba）品牌獨有的第三輪發酵工序，使其風味更加圓潤細膩。",
  },
  {
    number: "03",
    title: "分揀與陳化",
    titleEn: "Sorting & Aging",
    description:
      "經驗豐富的分揀師按照菸葉的顏色、質地和大小進行嚴格分類。優質菸葉會在恆溫恆濕的倉庫中陳化數月甚至數年，使風味更加醇厚。",
  },
  {
    number: "04",
    title: "手工卷製",
    titleEn: "Hand Rolling",
    description:
      "Torcedor（卷茄師）使用一把 Chaveta（半月形刀）和一塊木板，將精選的茄芯、茄套和茄衣完美結合。一位熟練的卷茄師每天僅能完成 60-150 支雪茄，視規格而定。",
  },
  {
    number: "05",
    title: "品質檢驗",
    titleEn: "Quality Control",
    description:
      "每支雪茄都必須通過嚴格的品質檢驗，包括外觀、重量、硬度和抽吸阻力的測試。不合格的產品會被無情淘汰，確保每一支出廠的雪茄都代表著古巴的最高標準。",
  },
  {
    number: "06",
    title: "陳放與裝箱",
    titleEn: "Aging & Packaging",
    description:
      "成品雪茄會在 Escaparate（陳放室）中靜置數週至數月，讓茄芯、茄套和茄衣的風味充分融合。最後由 Escogedora（選色師）按照茄衣顏色的深淺排列裝箱。",
  },
]

export function CraftProcess() {
  return (
    <section className="py-20 px-4 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Left: Sticky Image */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">
                Craftsmanship
              </p>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground text-balance">
                匠心獨運的製茄工藝
              </h2>
              <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
                一支古巴雪茄從種植到成品，需要經歷超過 200 道工序，歷時 2-5 年。每一步都是對耐心與技藝的極致考驗。
              </p>
              <div className="mt-8 relative aspect-[3/4] overflow-hidden">
                <Image
                  src="/images/torcedor.jpg"
                  alt="Torcedor 卷茄師手工製作雪茄"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-xs text-white/70 italic">
                    Torcedor -- 古巴製茄的守護者
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
