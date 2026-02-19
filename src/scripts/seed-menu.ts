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
  const existing = await menuService.listMenus({ key: "main" })
  if (existing.length > 0) {
    console.log("Main menu already exists, skipping seed.")
    return
  }

  // Create main menu
  const menu = await menuService.createMenus({
    name: "主导航",
    key: "main",
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

  console.log("Mega Menu seed data created successfully!")
}
