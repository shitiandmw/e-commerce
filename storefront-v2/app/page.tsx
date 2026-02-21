import { HeroCarousel } from "@/components/home/hero-carousel"
import { HotPicks } from "@/components/home/flash-sale"
import { FeaturedCuban } from "@/components/home/featured-cuban"
import { LimitedEditions } from "@/components/home/limited-editions"
import { BeginnerSection } from "@/components/home/beginner-section"
import { BrandSpotlight } from "@/components/home/brand-spotlight"
import { ServiceBar } from "@/components/home/service-bar"
import { BlogPreview } from "@/components/home/blog-preview"
import { RegisterCTA } from "@/components/home/register-cta"
import { fetchContent } from "@/lib/medusa"

interface BannerItem {
  id: string
  image_url: string
  title?: string | null
  subtitle?: string | null
  link_url?: string | null
  cta_text?: string | null
  sort_order: number
  is_enabled: boolean
}

interface BannerSlot {
  id: string
  key: string
  items: BannerItem[]
}

interface BannersResponse {
  banners: BannerSlot[]
}

export default async function HomePage() {
  let bannerSlides: BannerItem[] = []
  try {
    const data = await fetchContent<BannersResponse>("/store/content/banners", {
      position: "homepage-hero",
    })
    bannerSlides = data?.banners?.[0]?.items ?? []
  } catch {
    // API 不可用时 fallback 为空，HeroCarousel 会显示占位
  }

  return (
    <>
      <HeroCarousel slides={bannerSlides} />
      <HotPicks />
      <FeaturedCuban />
      <LimitedEditions />
      <BeginnerSection />
      <BrandSpotlight />
      <ServiceBar />
      <BlogPreview />
      <RegisterCTA />
    </>
  )
}
