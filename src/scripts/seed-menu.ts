/**
 * Seed script for Mega Menu demo data.
 * Run: npx medusa exec src/scripts/seed-menu.ts
 */
import { ExecArgs } from "@medusajs/framework/types"
import { MENU_MODULE } from "../modules/menu"
import MenuModuleService from "../modules/menu/service"

export default async function seedMenu({ container }: ExecArgs) {
  const menuService: MenuModuleService = container.resolve(MENU_MODULE)

  // Check if main menu already exists
  const existing = await menuService.listMenus({ key: "main-nav" })
  if (existing.length > 0) {
    console.log("Main menu already exists, skipping seed.")
    return
  }

  // Create main menu
  const menu = await menuService.createMenus({
    name: "主导航",
    key: "main-nav",
    description: "网站主导航菜单",
  })

  const menuId = menu.id

  // 1. 古巴雪茄 (brand type - will show brand grid via API)
  await menuService.createMenuItems({
    label: "古巴雪茄",
    url: "/categories/cuban-cigars",
    sort_order: 0,
    is_enabled: true,
    metadata: { item_type: "brand", brand_origin: "cuban" },
    menu_id: menuId,
  })

  // 2. 世界品牌 (brand type - will show brand grid)
  await menuService.createMenuItems({
    label: "世界品牌",
    url: "/brands",
    sort_order: 1,
    is_enabled: true,
    metadata: { item_type: "brand", brand_origin: "world" },
    menu_id: menuId,
  })

  // 3. 雪茄配件 (category with subcategories)
  const accessories = await menuService.createMenuItems({
    label: "雪茄配件",
    url: "/categories/accessories",
    sort_order: 2,
    is_enabled: true,
    menu_id: menuId,
  })

  const accSubs = [
    { label: "雪茄剪", url: "/categories/cutters", sort_order: 0 },
    { label: "打火机", url: "/categories/lighters", sort_order: 1 },
    { label: "保湿盒", url: "/categories/humidors", sort_order: 2 },
    { label: "烟灰缸", url: "/categories/ashtrays", sort_order: 3 },
  ]

  for (const sub of accSubs) {
    await menuService.createMenuItems({
      ...sub,
      is_enabled: true,
      parent_id: accessories.id,
      menu_id: menuId,
    })
  }

  // 4. 新品上市 (simple link)
  await menuService.createMenuItems({
    label: "新品上市",
    url: "/categories/new-arrivals",
    sort_order: 3,
    is_enabled: true,
    menu_id: menuId,
  })

  // 5. 特惠专区 (simple link)
  await menuService.createMenuItems({
    label: "特惠专区",
    url: "/categories/deals",
    sort_order: 4,
    is_enabled: true,
    menu_id: menuId,
  })

  // 6. 雪茄知识 (category with subcategories)
  const knowledge = await menuService.createMenuItems({
    label: "雪茄知识",
    url: "/articles",
    sort_order: 5,
    is_enabled: true,
    menu_id: menuId,
  })

  const knowledgeSubs = [
    { label: "入门指南", url: "/articles?category=beginner", sort_order: 0 },
    { label: "品鉴技巧", url: "/articles?category=tasting", sort_order: 1 },
    { label: "保养存储", url: "/articles?category=storage", sort_order: 2 },
  ]

  for (const sub of knowledgeSubs) {
    await menuService.createMenuItems({
      ...sub,
      is_enabled: true,
      parent_id: knowledge.id,
      menu_id: menuId,
    })
  }

  console.log("Main navigation seed data created successfully!")

  // Create footer menu
  const existingFooter = await menuService.listMenus({ key: "footer" })
  if (existingFooter.length > 0) {
    console.log("Footer menu already exists, skipping.")
    return
  }

  const footer = await menuService.createMenus({
    name: "页脚导航",
    key: "footer",
    description: "网站页脚导航菜单",
  })

  const footerId = footer.id

  // 1. 快速連結
  const quickLinks = await menuService.createMenuItems({
    label: "快速連結",
    url: "#",
    sort_order: 0,
    is_enabled: true,
    menu_id: footerId,
  })

  const quickLinkSubs = [
    { label: "首頁", url: "/", sort_order: 0 },
    { label: "所有商品", url: "/products", sort_order: 1 },
    { label: "古巴雪茄", url: "/categories/cuban-cigars", sort_order: 2 },
    { label: "世界品牌", url: "/brands", sort_order: 3 },
    { label: "新品上市", url: "/categories/new-arrivals", sort_order: 4 },
    { label: "特惠專區", url: "/categories/deals", sort_order: 5 },
  ]

  for (const sub of quickLinkSubs) {
    await menuService.createMenuItems({
      ...sub,
      is_enabled: true,
      parent_id: quickLinks.id,
      menu_id: footerId,
    })
  }

  // 2. 商品分類
  const categories = await menuService.createMenuItems({
    label: "商品分類",
    url: "#",
    sort_order: 1,
    is_enabled: true,
    menu_id: footerId,
  })

  const categorySubs = [
    { label: "雪茄", url: "/categories/cigars", sort_order: 0 },
    { label: "迷你雪茄", url: "/categories/mini-cigars", sort_order: 1 },
    { label: "雪茄配件", url: "/categories/accessories", sort_order: 2 },
    { label: "保濕盒", url: "/categories/humidors", sort_order: 3 },
    { label: "打火機", url: "/categories/lighters", sort_order: 4 },
    { label: "雪茄剪", url: "/categories/cutters", sort_order: 5 },
  ]

  for (const sub of categorySubs) {
    await menuService.createMenuItems({
      ...sub,
      is_enabled: true,
      parent_id: categories.id,
      menu_id: footerId,
    })
  }

  // 3. 客戶服務
  const customerService = await menuService.createMenuItems({
    label: "客戶服務",
    url: "#",
    sort_order: 2,
    is_enabled: true,
    menu_id: footerId,
  })

  const serviceSubs = [
    { label: "聯繫我們", url: "/contact", sort_order: 0 },
    { label: "常見問題", url: "/faq", sort_order: 1 },
    { label: "配送說明", url: "/shipping", sort_order: 2 },
    { label: "退換貨政策", url: "/returns", sort_order: 3 },
    { label: "隱私政策", url: "/privacy", sort_order: 4 },
  ]

  for (const sub of serviceSubs) {
    await menuService.createMenuItems({
      ...sub,
      is_enabled: true,
      parent_id: customerService.id,
      menu_id: footerId,
    })
  }

  // 4. 關於我們
  const aboutUs = await menuService.createMenuItems({
    label: "關於我們",
    url: "#",
    sort_order: 3,
    is_enabled: true,
    menu_id: footerId,
  })

  const aboutSubs = [
    { label: "品牌故事", url: "/about", sort_order: 0 },
    { label: "雪茄知識", url: "/articles", sort_order: 1 },
    { label: "最新文章", url: "/blog", sort_order: 2 },
  ]

  for (const sub of aboutSubs) {
    await menuService.createMenuItems({
      ...sub,
      is_enabled: true,
      parent_id: aboutUs.id,
      menu_id: footerId,
    })
  }

  console.log("Footer menu seed data created successfully!")
}
