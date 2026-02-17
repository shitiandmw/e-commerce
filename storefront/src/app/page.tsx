import { fetchContent } from "@/lib/medusa"
import HeroBanner from "@/components/HeroBanner"
import CuratedCollections from "@/components/CuratedCollections"
import BrandShowcase from "@/components/BrandShowcase"
import LatestArticles from "@/components/LatestArticles"
import PopupModal from "@/components/PopupModal"

interface HomeData {
  banners: any[]
  collections: any[]
  popups: any[]
}

interface BrandsData {
  brands: any[]
}

interface ArticlesData {
  articles: any[]
}

export default async function Home() {
  let homeData: HomeData = { banners: [], collections: [], popups: [] }
  let brandsData: BrandsData = { brands: [] }
  let articlesData: ArticlesData = { articles: [] }

  try {
    ;[homeData, brandsData, articlesData] = await Promise.all([
      fetchContent<HomeData>("/store/content/home"),
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
        <div className="flex flex-col items-center justify-center px-4 py-24">
          <h1 className="mb-4 text-4xl font-bold tracking-wider text-gold">
            TIMECIGAR
          </h1>
          <p className="mb-8 max-w-md text-center text-lg text-muted">
            精选雪茄，品味生活。探索来自全球的优质雪茄。
          </p>
          <a
            href="/products"
            className="rounded-md bg-gold px-8 py-3 text-sm font-semibold text-background transition-colors hover:bg-gold-light"
          >
            浏览商品
          </a>
        </div>
      )}

      <CuratedCollections collections={homeData.collections || []} />
      <BrandShowcase brands={brandsData.brands || []} />
      <LatestArticles articles={articlesData.articles || []} />
      <PopupModal popups={homeData.popups || []} />
    </>
  )
}
