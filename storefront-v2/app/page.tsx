import { HeroCarousel } from "@/components/home/hero-carousel"
import { HotPicks } from "@/components/home/flash-sale"
import { FeaturedCuban } from "@/components/home/featured-cuban"
import { LimitedEditions } from "@/components/home/limited-editions"
import { BeginnerSection } from "@/components/home/beginner-section"
import { BrandSpotlight } from "@/components/home/brand-spotlight"
import { ServiceBar } from "@/components/home/service-bar"
import { BlogPreview, type ArticleItem } from "@/components/home/blog-preview"
import { RegisterCTA } from "@/components/home/register-cta"
import { fetchContent } from "@/lib/medusa"
import { fetchCollectionWithPrices } from "@/lib/data/collections"

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

interface ArticlesResponse {
  articles: ArticleItem[]
  count: number
  offset: number
  limit: number
}

export default async function HomePage() {
  // 并行获取所有首页数据
  const [
    bannerResult,
    hotPicksProducts,
    featuredCubanProducts,
    limitedEditionsProducts,
    articlesResult,
  ] = await Promise.allSettled([
    fetchContent<BannersResponse>("/store/content/banners", {
      position: "homepage-hero",
    }),
    fetchCollectionWithPrices("hot-picks"),
    fetchCollectionWithPrices("featured-cuban"),
    fetchCollectionWithPrices("limited-editions"),
    fetchContent<ArticlesResponse>("/store/content/articles", {
      limit: "3",
    }),
  ])

  const bannerSlides =
    bannerResult.status === "fulfilled"
      ? bannerResult.value?.banners?.[0]?.items ?? []
      : []

  const articles =
    articlesResult.status === "fulfilled"
      ? articlesResult.value?.articles ?? []
      : []

  return (
    <>
      <HeroCarousel slides={bannerSlides} />
      <HotPicks
        products={hotPicksProducts.status === "fulfilled" ? hotPicksProducts.value : []}
      />
      <FeaturedCuban
        products={featuredCubanProducts.status === "fulfilled" ? featuredCubanProducts.value : []}
      />
      <LimitedEditions
        products={limitedEditionsProducts.status === "fulfilled" ? limitedEditionsProducts.value : []}
      />
      <BeginnerSection />
      <BrandSpotlight />
      <ServiceBar />
      <BlogPreview articles={articles} />
      <RegisterCTA />
    </>
  )
}
