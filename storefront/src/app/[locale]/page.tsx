import { fetchContent } from "@/lib/medusa"
import HeroBanner from "@/components/HeroBanner"
import CuratedCollections from "@/components/CuratedCollections"
import CategoryBanners from "@/components/CategoryBanners"
import BrandShowcase from "@/components/BrandShowcase"
import LatestArticles from "@/components/LatestArticles"
import PopupModal from "@/components/PopupModal"
import CouponPopup from "@/components/CouponPopup"

interface HomeData {
  banners: any[]
  collections: any[]
  popups: any[]
}

interface BannersData {
  banners: any[]
}

interface BrandsData {
  brands: any[]
}

interface ArticlesData {
  articles: any[]
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  let homeData: HomeData = { banners: [], collections: [], popups: [] }
  let categoryBannersData: BannersData = { banners: [] }
  let brandsData: BrandsData = { brands: [] }
  let articlesData: ArticlesData = { articles: [] }

  try {
    ;[homeData, categoryBannersData, brandsData, articlesData] = await Promise.all([
      fetchContent<HomeData>("/store/content/home"),
      fetchContent<BannersData>("/store/content/banners", { position: "home_category" }),
      fetchContent<BrandsData>("/store/content/brands"),
      fetchContent<ArticlesData>("/store/content/articles?limit=4"),
    ])
  } catch (e) {
    console.error("Failed to fetch homepage data:", e)
  }

  return (
    <>
      <HeroBanner banners={homeData.banners || []} />

      {(!homeData.banners || homeData.banners.length === 0) && (
        <section className="flex flex-col items-center justify-center px-4 py-20 md:py-28">
          <h1 className="mb-4 text-3xl font-bold tracking-wider text-gold md:text-5xl">
            TIMECIGAR
          </h1>
          <p className="mb-8 max-w-md text-center text-base text-muted md:text-lg">
            精选雪茄，品味生活。探索来自全球的优质雪茄。
          </p>
          <a
            href={`/${locale}/products`}
            className="inline-flex min-h-[44px] items-center rounded-md bg-gold px-8 py-3 text-sm font-semibold text-background transition-colors hover:bg-gold-light"
          >
            浏览商品
          </a>
        </section>
      )}

      <CuratedCollections collections={homeData.collections || []} />
      <CategoryBanners banners={categoryBannersData.banners || []} />
      <BrandShowcase brands={brandsData.brands || []} />
      <LatestArticles articles={articlesData.articles || []} />
      <PopupModal popups={(homeData.popups || []).filter((p: any) => p.popup_type !== "coupon")} />
      <CouponPopup popups={(homeData.popups || []).filter((p: any) => p.popup_type === "coupon")} />
    </>
  )
}
