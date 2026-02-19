/**
 * Seed script for cigar product categories.
 * Replaces default Medusa categories (Shirts/Sweatshirts/Pants/Merch)
 * with cigar-industry categories.
 * Run: npx medusa exec src/scripts/seed-categories.ts
 */
import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

const cigarCategories = [
  { name: "古巴雪茄", handle: "cuban-cigars", description: "来自古巴的正宗哈瓦那雪茄" },
  { name: "世界品牌", handle: "world-brands", description: "来自多米尼加、尼加拉瓜、洪都拉斯等产区的世界品牌雪茄" },
  { name: "古巴小雪茄", handle: "cuban-cigarillos", description: "古巴产小雪茄和迷你雪茄" },
  { name: "烟丝", handle: "pipe-tobacco", description: "优质烟斗烟丝" },
  { name: "雪茄配件", handle: "accessories", description: "雪茄剪、打火机、保湿盒等配件" },
  { name: "组合套装", handle: "bundles", description: "精选雪茄组合套装，适合送礼或尝鲜" },
  { name: "特惠专区", handle: "deals", description: "限时特惠和促销商品" },
  { name: "新品上市", handle: "new-arrivals", description: "最新到货的雪茄和配件" },
]

export default async function seedCategories({ container }: ExecArgs) {
  const productCategoryService = container.resolve(Modules.PRODUCT)

  // Check if cigar categories already exist
  const existing = await productCategoryService.listProductCategories({
    handle: "cuban-cigars",
  })
  if (existing.length > 0) {
    console.log("Cigar categories already exist, skipping seed.")
    return
  }

  // Delete default Medusa categories
  const defaults = ["Shirts", "Sweatshirts", "Pants", "Merch"]
  for (const name of defaults) {
    const cats = await productCategoryService.listProductCategories({ name })
    for (const cat of cats) {
      try {
        await productCategoryService.deleteProductCategories(cat.id)
        console.log(`Deleted default category: ${name}`)
      } catch (e: any) {
        console.warn(`Could not delete category ${name}: ${e.message}`)
      }
    }
  }

  // Create cigar categories
  for (const cat of cigarCategories) {
    await productCategoryService.createProductCategories({
      name: cat.name,
      handle: cat.handle,
      description: cat.description,
      is_active: true,
      is_internal: false,
    })
  }

  console.log(`Seeded ${cigarCategories.length} cigar categories.`)
}
