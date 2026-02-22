import type { Metadata } from "next"
import { BrandStoryHero } from "@/components/brand-story/hero"
import { HistoryTimeline } from "@/components/brand-story/history-timeline"
import { CraftProcess } from "@/components/brand-story/craft-process"
import { VueltaAbajo } from "@/components/brand-story/vuelta-abajo"
import { BrandShowcase } from "@/components/brand-story/brand-showcase"
import { BrandStoryCTA } from "@/components/brand-story/cta"

export const metadata: Metadata = {
  title: "古巴製茄的百年傳承 | TimeCigar 雪茄時間",
  description:
    "從Vuelta Abajo的肥沃土壤到哈瓦那的製茄工坊，探索古巴雪茄500年的傳奇歷史、傳統製茄工藝和27個經典品牌。",
}

export default function BrandStoryPage() {
  return (
    <>
      <BrandStoryHero />
      <HistoryTimeline />
      <VueltaAbajo />
      <CraftProcess />
      <BrandShowcase />
      <BrandStoryCTA />
    </>
  )
}
