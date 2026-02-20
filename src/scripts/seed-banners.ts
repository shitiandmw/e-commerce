/**
 * Seed script for Banner/Hero data with real images.
 * Run: npx medusa exec src/scripts/seed-banners.ts
 */
import { ExecArgs } from "@medusajs/framework/types"
import { BANNER_MODULE } from "../modules/banner"
import BannerModuleService from "../modules/banner/service"

export default async function seedBanners({ container }: ExecArgs) {
  const bannerService: BannerModuleService = container.resolve(BANNER_MODULE)

  // Check if banners already exist
  const existing = await bannerService.listBannerSlots({}, { take: 1 })
  if (existing.length > 0) {
    console.log("Banners already exist, skipping seed.")
    return
  }

  console.log("Seeding banner data...")

  // 1. Hero Banner (homepage main carousel)
  const hero = await bannerService.createBannerSlots({
    name: "首页轮播",
    key: "hero",
    description: "首页顶部大图轮播",
  })

  const heroItems = [
    {
      image_url: "https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?w=1920&h=600&fit=crop",
      title: "探索古巴雪茄的世界",
      subtitle: "精选哈瓦那顶级雪茄，品味百年传承",
      link_url: "/categories/cuban-cigars",
      sort_order: 0,
    },
    {
      image_url: "https://images.unsplash.com/photo-1528458876861-544fd1b4e625?w=1920&h=600&fit=crop",
      title: "世界品牌精选",
      subtitle: "来自多米尼加、尼加拉瓜的顶级雪茄",
      link_url: "/categories/world-brands",
      sort_order: 1,
    },
    {
      image_url: "https://images.unsplash.com/photo-1574282893982-ff1675ba4900?w=1920&h=600&fit=crop",
      title: "新品上市",
      subtitle: "最新到货的限量版雪茄，先到先得",
      link_url: "/categories/new-arrivals",
      sort_order: 2,
    },
  ]

  for (const item of heroItems) {
    await bannerService.createBannerItems({
      ...item,
      is_enabled: true,
      slot_id: hero.id,
    })
  }

  // 2. Category banners
  const catBanner = await bannerService.createBannerSlots({
    name: "分类横幅",
    key: "home_category",
    description: "分类页面顶部横幅",
  })

  const catItems = [
    {
      image_url: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1200&h=400&fit=crop",
      title: "古巴雪茄",
      subtitle: "正宗哈瓦那雪茄，百年传承",
      link_url: "/categories/cuban-cigars",
      sort_order: 0,
    },
    {
      image_url: "https://images.unsplash.com/photo-1571104508999-893933ded431?w=1200&h=400&fit=crop",
      title: "雪茄配件",
      subtitle: "专业雪茄剪、打火机、保湿盒",
      link_url: "/categories/accessories",
      sort_order: 1,
    },
  ]

  for (const item of catItems) {
    await bannerService.createBannerItems({
      ...item,
      is_enabled: true,
      slot_id: catBanner.id,
    })
  }

  // 3. Promo banner (small promotional strip)
  const promo = await bannerService.createBannerSlots({
    name: "促销横幅",
    key: "promo",
    description: "促销活动小横幅",
  })

  await bannerService.createBannerItems({
    image_url: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=1200&h=300&fit=crop",
    title: "限时特惠",
    subtitle: "精选雪茄低至8折，满额包邮",
    link_url: "/categories/deals",
    sort_order: 0,
    is_enabled: true,
    slot_id: promo.id,
  })

  console.log("Banner seed data created successfully!")
}
