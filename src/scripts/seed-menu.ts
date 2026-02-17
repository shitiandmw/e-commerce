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

  // 1. 古巴雪茄 (category with subcategories)
  const cuban = await menuService.createMenuItems({
    label: "古巴雪茄",
    url: "/categories/cuban-cigars",
    sort_order: 0,
    is_enabled: true,
    menu_id: menuId,
  })

  const cubanSubs = [
    { label: "高希霸", url: "/categories/cohiba", sort_order: 0 },
    { label: "蒙特克里斯托", url: "/categories/montecristo", sort_order: 1 },
    { label: "帕塔加斯", url: "/categories/partagas", sort_order: 2 },
    { label: "罗密欧与朱丽叶", url: "/categories/romeo-y-julieta", sort_order: 3 },
    { label: "乌普曼", url: "/categories/h-upmann", sort_order: 4 },
    { label: "玻利瓦尔", url: "/categories/bolivar", sort_order: 5 },
  ]

  for (const sub of cubanSubs) {
    await menuService.createMenuItems({
      ...sub,
      is_enabled: true,
      parent_id: cuban.id,
      menu_id: menuId,
    })
  }

  // 2. 世界品牌 (brand type - will show brand grid)
  await menuService.createMenuItems({
    label: "世界品牌",
    url: "/brands",
    sort_order: 1,
    is_enabled: true,
    metadata: { item_type: "brand" },
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
    url: "/new-arrivals",
    sort_order: 3,
    is_enabled: true,
    menu_id: menuId,
  })

  // 5. 雪茄知识 (category with subcategories)
  const knowledge = await menuService.createMenuItems({
    label: "雪茄知识",
    url: "/articles",
    sort_order: 4,
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
