import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { BrandStoryHero } from "@/components/brand-story/hero"
import { HistoryTimeline } from "@/components/brand-story/history-timeline"
import { CraftProcess } from "@/components/brand-story/craft-process"
import { VueltaAbajo } from "@/components/brand-story/vuelta-abajo"
import { BrandShowcase } from "@/components/brand-story/brand-showcase"
import { BrandStoryCTA } from "@/components/brand-story/cta"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations()
  return {
    title: t("bs_page_title"),
    description: t("bs_page_description"),
  }
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
