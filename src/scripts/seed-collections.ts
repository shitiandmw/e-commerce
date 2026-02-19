/**
 * Seed script for CuratedCollections with cigar products.
 * Creates curated collections and cigar products to populate homepage sections.
 * Run: npx medusa exec src/scripts/seed-collections.ts
 */
import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createProductsWorkflow,
  createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"
import { CURATED_COLLECTION_MODULE } from "../modules/curated-collection"
import CuratedCollectionModuleService from "../modules/curated-collection/service"
import { BRAND_MODULE } from "../modules/brand"
import BrandModuleService from "../modules/brand/service"

// Unsplash cigar-related images (free to use)
const cigarImages = [
  "https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1528458876861-544fd1b4e625?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1574282893982-ff1675ba4900?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1571104508999-893933ded431?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1486578077620-8a022d04e24b?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1553545985-1e0d8781d5db?w=800&h=800&fit=crop",
]

interface CigarProduct {
  title: string
  handle: string
  description: string
  priceEur: number
  priceUsd: number
  imageIdx: number
}

const cigarProducts: CigarProduct[] = [
  { title: "Cohiba Siglo VI", handle: "cohiba-siglo-vi", description: "高希霸世纪六号，古巴雪茄的巅峰之作，口感醇厚复杂", priceEur: 4500, priceUsd: 4800, imageIdx: 0 },
  { title: "Montecristo No.2", handle: "montecristo-no2", description: "蒙特二号，全球最受欢迎的古巴雪茄之一，鱼雷型经典", priceEur: 2200, priceUsd: 2400, imageIdx: 1 },
  { title: "Partagas Serie D No.4", handle: "partagas-serie-d-no4", description: "帕特加斯D4，浓郁辛辣的古巴经典，罗布图型标杆", priceEur: 1800, priceUsd: 2000, imageIdx: 2 },
  { title: "Romeo y Julieta Wide Churchill", handle: "ryj-wide-churchill", description: "罗密欧宽丘吉尔，优雅平衡的中等浓度雪茄", priceEur: 2000, priceUsd: 2200, imageIdx: 3 },
  { title: "Trinidad Fundadores", handle: "trinidad-fundadores", description: "特立尼达创始人，曾为古巴外交礼品的顶级雪茄", priceEur: 3800, priceUsd: 4100, imageIdx: 4 },
  { title: "H. Upmann Magnum 46", handle: "h-upmann-magnum-46", description: "优名玛格南46，柔和细腻的中等浓度古巴雪茄", priceEur: 1600, priceUsd: 1800, imageIdx: 5 },
  { title: "Bolivar Belicosos Finos", handle: "bolivar-belicosos-finos", description: "保利华贝利科索，以强劲浓郁著称的古巴鱼雷型雪茄", priceEur: 1900, priceUsd: 2100, imageIdx: 6 },
  { title: "Hoyo de Monterrey Epicure No.2", handle: "hoyo-epicure-no2", description: "好友伊壁鸠鲁二号，口感醇和的经典罗布图", priceEur: 1500, priceUsd: 1700, imageIdx: 7 },
  { title: "Davidoff Winston Churchill", handle: "davidoff-winston-churchill", description: "大卫杜夫丘吉尔系列，瑞士精工的世界级雪茄", priceEur: 3200, priceUsd: 3500, imageIdx: 0 },
  { title: "Padron 1926 Serie No.1", handle: "padron-1926-no1", description: "帕德龙1926一号，尼加拉瓜顶级雪茄的代表作", priceEur: 2800, priceUsd: 3000, imageIdx: 1 },
  { title: "Arturo Fuente OpusX", handle: "arturo-fuente-opusx", description: "阿图罗富恩特OpusX，多米尼加最珍贵的雪茄之一", priceEur: 3500, priceUsd: 3800, imageIdx: 2 },
  { title: "My Father Le Bijou 1922", handle: "my-father-le-bijou-1922", description: "我的父亲珍宝1922，多次获得年度雪茄大奖", priceEur: 1400, priceUsd: 1600, imageIdx: 3 },
  { title: "Oliva Serie V Melanio", handle: "oliva-serie-v-melanio", description: "奥利瓦V系列梅拉尼奥，尼加拉瓜精品雪茄的典范", priceEur: 1300, priceUsd: 1500, imageIdx: 4 },
  { title: "Drew Estate Liga Privada No.9", handle: "liga-privada-no9", description: "德鲁庄园联盟私藏九号，美国市场最受追捧的精品雪茄", priceEur: 1600, priceUsd: 1800, imageIdx: 5 },
  { title: "Plasencia Alma Fuerte", handle: "plasencia-alma-fuerte", description: "帕拉森强魂系列，中美洲烟叶世家的杰作", priceEur: 1500, priceUsd: 1700, imageIdx: 6 },
  { title: "La Gloria Cubana Medaille d'Or No.4", handle: "lgc-medaille-dor-no4", description: "古巴荣耀金牌四号，浓郁复杂的古巴经典", priceEur: 1200, priceUsd: 1400, imageIdx: 7 },
]

export default async function seedCollections({ container }: ExecArgs) {
  const collectionService: CuratedCollectionModuleService =
    container.resolve(CURATED_COLLECTION_MODULE)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // Check if collections already exist
  const existing = await collectionService.listCuratedCollections(
    { key: "featured" },
    { take: 1 }
  )
  if (existing.length > 0) {
    console.log("Curated collections already exist, skipping seed.")
    return
  }

  // Get required data
  const productService = container.resolve(Modules.PRODUCT)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)

  const salesChannels = await salesChannelService.listSalesChannels({
    name: "Default Sales Channel",
  })
  const salesChannelId = salesChannels[0]?.id
  if (!salesChannelId) {
    console.error("No default sales channel found. Run seed.ts first.")
    return
  }

  const shippingProfiles = await fulfillmentService.listShippingProfiles({
    type: "default",
  })
  const shippingProfileId = shippingProfiles[0]?.id
  if (!shippingProfileId) {
    console.error("No shipping profile found. Run seed.ts first.")
    return
  }

  // Get cuban-cigars category
  const cubanCats = await productService.listProductCategories({
    handle: "cuban-cigars",
  })
  const worldCats = await productService.listProductCategories({
    handle: "world-brands",
  })
  const cubanCatId = cubanCats[0]?.id
  const worldCatId = worldCats[0]?.id

  // Get stock location
  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
  })
  const stockLocationId = stockLocations[0]?.id

  console.log("Creating cigar products...")

  const productIds: string[] = []
  for (const cigar of cigarProducts) {
    const isCuban = cigar.handle.startsWith("cohiba") ||
      cigar.handle.startsWith("montecristo") ||
      cigar.handle.startsWith("partagas") ||
      cigar.handle.startsWith("ryj") ||
      cigar.handle.startsWith("trinidad") ||
      cigar.handle.startsWith("h-upmann") ||
      cigar.handle.startsWith("bolivar") ||
      cigar.handle.startsWith("hoyo") ||
      cigar.handle.startsWith("lgc")

    const categoryIds: string[] = []
    if (isCuban && cubanCatId) categoryIds.push(cubanCatId)
    if (!isCuban && worldCatId) categoryIds.push(worldCatId)

    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: cigar.title,
            handle: cigar.handle,
            description: cigar.description,
            status: ProductStatus.PUBLISHED,
            shipping_profile_id: shippingProfileId,
            category_ids: categoryIds,
            images: [{ url: cigarImages[cigar.imageIdx] }],
            thumbnail: cigarImages[cigar.imageIdx],
            options: [{ title: "规格", values: ["单支", "盒装"] }],
            variants: [
              {
                title: "单支",
                sku: `${cigar.handle}-single`,
                options: { "规格": "单支" },
                prices: [
                  { amount: cigar.priceEur, currency_code: "eur" },
                  { amount: cigar.priceUsd, currency_code: "usd" },
                ],
              },
              {
                title: "盒装",
                sku: `${cigar.handle}-box`,
                options: { "规格": "盒装" },
                prices: [
                  { amount: cigar.priceEur * 20, currency_code: "eur" },
                  { amount: cigar.priceUsd * 20, currency_code: "usd" },
                ],
              },
            ],
            sales_channels: [{ id: salesChannelId }],
          },
        ],
      },
    })
    productIds.push(result[0].id)
  }

  // Create inventory levels for new products
  if (stockLocationId) {
    const { data: inventoryItems } = await query.graph({
      entity: "inventory_item",
      fields: ["id"],
    })
    for (const item of inventoryItems) {
      try {
        await createInventoryLevelsWorkflow(container).run({
          input: {
            inventory_levels: [
              {
                location_id: stockLocationId,
                stocked_quantity: 1000000,
                inventory_item_id: item.id,
              },
            ],
          },
        })
      } catch {
        // Level may already exist from seed.ts
      }
    }
  }

  console.log(`Created ${productIds.length} cigar products.`)

  // Create curated collections
  console.log("Creating curated collections...")

  // 1. Featured / 热门推荐
  const featured = await collectionService.createCuratedCollections({
    name: "热门推荐",
    key: "featured",
    description: "精选热门雪茄推荐",
    sort_order: 0,
  })

  for (let i = 0; i < 8 && i < productIds.length; i++) {
    await collectionService.createCollectionItems({
      product_id: productIds[i],
      sort_order: i,
      collection_id: featured.id,
    })
  }

  // 2. Deals / 限时特惠
  const deals = await collectionService.createCuratedCollections({
    name: "限时特惠",
    key: "deals",
    description: "限时优惠雪茄精选",
    sort_order: 1,
  })

  for (let i = 8; i < 16 && i < productIds.length; i++) {
    await collectionService.createCollectionItems({
      product_id: productIds[i],
      sort_order: i - 8,
      collection_id: deals.id,
    })
  }

  // 3. New Arrivals / 新品上市
  const newArrivals = await collectionService.createCuratedCollections({
    name: "新品上市",
    key: "new-arrivals",
    description: "最新到货雪茄",
    sort_order: 2,
  })

  // Use a mix of products for new arrivals
  const newArrivalIndices = [2, 5, 8, 10, 12, 14]
  for (let i = 0; i < newArrivalIndices.length; i++) {
    const idx = newArrivalIndices[i]
    if (idx < productIds.length) {
      await collectionService.createCollectionItems({
        product_id: productIds[idx],
        sort_order: i,
        collection_id: newArrivals.id,
      })
    }
  }

  console.log("Curated collections seeded successfully!")
}
