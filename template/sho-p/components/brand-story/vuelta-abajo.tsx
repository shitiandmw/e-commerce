import Image from "next/image"

const regions = [
  {
    name: "Vuelta Abajo",
    nameZh: "下維爾塔",
    description: "位於古巴最西端的比那爾德里奧省，被公認為世界上最優質的菸草產區。這裡獨特的紅色土壤、穩定的溫度和適宜的濕度，孕育出風味最為複雜細膩的菸葉。",
    highlight: true,
  },
  {
    name: "Semi Vuelta",
    nameZh: "半維爾塔",
    description: "緊鄰 Vuelta Abajo 的產區，出產的菸葉主要用作茄芯和茄套，品質同樣出眾。",
    highlight: false,
  },
  {
    name: "Partido",
    nameZh: "帕提多",
    description: "位於哈瓦那南部，以種植優質茄衣菸葉聞名。遮蔭種植（Tapado）技術在此達到巔峰。",
    highlight: false,
  },
  {
    name: "Vuelta Arriba",
    nameZh: "上維爾塔",
    description: "位於古巴東部，歷史悠久的菸草產區，出產風味獨特的菸葉，為多個品牌提供特色原料。",
    highlight: false,
  },
  {
    name: "Oriente",
    nameZh: "東方區",
    description: "古巴最東端的產區，雖然產量較小，但其菸葉帶有獨特的風土特徵，常用於特別版雪茄的配方。",
    highlight: false,
  },
]

export function VueltaAbajo() {
  return (
    <section className="py-20 px-4 lg:px-6 bg-card">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src="/images/vuelta-abajo.jpg"
              alt="Vuelta Abajo 菸草田"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-gold text-xs tracking-[0.2em] uppercase">
                Pinar del Rio, Cuba
              </p>
              <p className="mt-1 text-sm text-foreground/80">
                Vuelta Abajo -- 世界菸草的聖地
              </p>
            </div>
          </div>

          {/* Content */}
          <div>
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">
              Terroir
            </p>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground text-balance">
              風土的饋贈
            </h2>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
              古巴的菸草產區如同勃艮第的葡萄園，每一寸土地都有其獨特的性格。正是這些不可複製的風土條件，賦予了古巴雪茄無法模仿的靈魂。
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
