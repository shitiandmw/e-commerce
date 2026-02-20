/**
 * Seed script for cigar brand data.
 * Run: npx medusa exec src/scripts/seed-brands.ts
 */
import { ExecArgs } from "@medusajs/framework/types"
import { BRAND_MODULE } from "../modules/brand"
import BrandModuleService from "../modules/brand/service"

function logoUrl(name: string): string {
  const initials = name
    .split(/[\s.]+/)
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=128&background=1a1a2e&color=d4af37&bold=true`
}

interface BrandDef {
  name: string
  nameCn: string
  description: string
}

const cubanBrands: BrandDef[] = [
  { name: "Bolivar", nameCn: "保利华", description: "以南美解放者西蒙·玻利瓦尔命名，以浓郁强劲的口感著称的古巴雪茄品牌" },
  { name: "Cohiba", nameCn: "高希霸", description: "古巴最负盛名的雪茄品牌，原为古巴国家领导人专属雪茄" },
  { name: "Cuaba", nameCn: "库阿巴", description: "以古巴原住民用语命名，所有型号均为双尖造型的独特品牌" },
  { name: "Diplomaticos", nameCn: "外交官", description: "与蒙特克里斯托同厂生产，性价比极高的古巴雪茄品牌" },
  { name: "El Rey Del Mundo", nameCn: "埃尔德尔蒙多", description: "意为「世界之王」，以柔和细腻的口感闻名" },
  { name: "Fonseca", nameCn: "丰塞卡", description: "以创始人F.E.丰塞卡命名，口感轻柔优雅的古巴品牌" },
  { name: "H. Upmann", nameCn: "优名", description: "由德国银行家赫尔曼·乌普曼于1844年创立，历史悠久的经典品牌" },
  { name: "Hoyo de Monterrey", nameCn: "好友", description: "以古巴比那尔德里奥省的著名烟草谷命名，口感醇厚" },
  { name: "Jose L. Piedra", nameCn: "比雅达", description: "古巴最具性价比的手工雪茄品牌之一" },
  { name: "Juan Lopez", nameCn: "胡安洛佩斯", description: "以19世纪雪茄商人命名，中等浓度的优质古巴雪茄" },
  { name: "La Flor de Cano", nameCn: "拉弗洛尔德卡诺", description: "创立于1884年的古老品牌，口感轻柔适合入门" },
  { name: "La Gloria Cubana", nameCn: "古巴荣耀", description: "意为「古巴的荣耀」，以浓郁复杂的口感著称" },
  { name: "Montecristo", nameCn: "蒙特", description: "全球最畅销的古巴雪茄品牌，以大仲马小说命名" },
  { name: "Partagas", nameCn: "帕特加斯", description: "创立于1845年的传奇品牌，以浓郁辛辣的口感闻名" },
  { name: "Por Larranaga", nameCn: "波尔拉腊尼亚加", description: "古巴现存最古老的雪茄品牌之一，创立于1834年" },
  { name: "Punch", nameCn: "潘趣", description: "以英国幽默杂志命名，口感中等偏浓的经典品牌" },
  { name: "Quai d'Orsay", nameCn: "多尔塞", description: "专为法国市场打造的古巴雪茄品牌，口感轻柔优雅" },
  { name: "Quintero", nameCn: "金特罗", description: "以创始人Agustin Quintero命名，古巴最亲民的雪茄品牌" },
  { name: "Rafael Gonzalez", nameCn: "拉斐尔", description: "以英国雪茄进口商命名，口感细腻柔和" },
  { name: "Ramon Allones", nameCn: "莱蒙阿隆尼", description: "创立于1837年，首个使用彩色雪茄盒标签的品牌" },
  { name: "Romeo y Julieta", nameCn: "罗密欧朱丽叶", description: "以莎士比亚名剧命名，全球知名度最高的古巴品牌之一" },
  { name: "Saint Luis Rey", nameCn: "圣路易斯雷伊", description: "产量稀少的珍贵古巴品牌，口感浓郁饱满" },
  { name: "San Cristobal", nameCn: "圣克里斯多", description: "以哈瓦那旧名命名，2004年推出的较新品牌" },
  { name: "Sancho Panza", nameCn: "参杜士奔莎", description: "以堂吉诃德的侍从命名，口感轻柔的古巴品牌" },
  { name: "Trinidad", nameCn: "特立尼达", description: "原为古巴外交礼品专用，1998年才公开发售的顶级品牌" },
  { name: "Vegas Robaina", nameCn: "瓦格斯陆班纳", description: "以传奇烟农Alejandro Robaina命名，1997年推出" },
  { name: "Vegueros", nameCn: "威古洛", description: "意为「烟农」，展现比那尔德里奥省风土的品牌" },
]

const worldBrands: BrandDef[] = [
  { name: "Arturo Fuente", nameCn: "阿图罗富恩特", description: "多米尼加顶级雪茄家族品牌，OpusX系列享誉全球" },
  { name: "Davidoff", nameCn: "大卫杜夫", description: "瑞士奢侈雪茄品牌，以精致优雅的风格闻名世界" },
  { name: "AJ Fernandez", nameCn: "AJ费尔南德斯", description: "尼加拉瓜新生代大师，多次获得年度雪茄大奖" },
  { name: "Oliva", nameCn: "奥利瓦", description: "尼加拉瓜顶级品牌，Serie V系列广受好评" },
  { name: "Padron", nameCn: "帕德龙", description: "尼加拉瓜传奇家族品牌，1926和1964系列是行业标杆" },
  { name: "Rocky Patel", nameCn: "洛基帕特尔", description: "美国最成功的精品雪茄品牌之一，Decade系列经典" },
  { name: "My Father", nameCn: "我的父亲", description: "古巴裔大师Don Pepin Garcia创立，多次斩获年度雪茄" },
  { name: "Drew Estate", nameCn: "德鲁庄园", description: "以创新闻名的尼加拉瓜品牌，Liga Privada系列极受追捧" },
  { name: "Ashton", nameCn: "阿什顿", description: "多米尼加高端品牌，与Fuente家族合作生产" },
  { name: "Camacho", nameCn: "卡马乔", description: "洪都拉斯品牌，以浓郁强劲的口感著称" },
  { name: "Plasencia", nameCn: "帕拉森", description: "中美洲最大的烟叶种植家族，Alma系列广受赞誉" },
  { name: "Perdomo", nameCn: "佩尔多莫", description: "尼加拉瓜家族品牌，以高性价比和稳定品质闻名" },
  { name: "Macanudo", nameCn: "麦克纽杜", description: "美国市场最畅销的雪茄品牌之一，口感柔和" },
  { name: "La Aurora", nameCn: "拉奥罗拉", description: "多米尼加最古老的雪茄工厂，创立于1903年" },
  { name: "Joya De Nicaragua", nameCn: "尼加拉瓜珍宝", description: "尼加拉瓜第一个雪茄品牌，Antano系列经典" },
  { name: "Foundation", nameCn: "基地", description: "由行业传奇Nick Melillo创立的精品品牌" },
  { name: "Aganorsa Leaf", nameCn: "紫檀叶", description: "拥有尼加拉瓜顶级烟叶农场的垂直整合品牌" },
  { name: "CAO", nameCn: "CAO", description: "以创新混合和独特包装闻名的国际品牌" },
  { name: "Gurkha", nameCn: "廓尔喀", description: "以奢华定位闻名的高端雪茄品牌" },
  { name: "Villiger", nameCn: "威力加", description: "瑞士百年雪茄品牌，欧洲市场领导者" },
  { name: "VegaFina", nameCn: "唯佳", description: "西班牙Altadis集团旗下的优质多米尼加品牌" },
  { name: "Tatuaje", nameCn: "塔图", description: "由Pete Johnson创立的精品品牌，古巴风格尼加拉瓜雪茄" },
  { name: "E.P. Carrillo", nameCn: "EP卡里洛", description: "多米尼加大师Ernesto Perez-Carrillo的同名品牌" },
  { name: "Bossner", nameCn: "博斯纳", description: "瑞士奢侈雪茄品牌，以精美包装和高端定位闻名" },
  { name: "Aladino", nameCn: "阿拉丁", description: "洪都拉斯Eiroa家族的精品品牌，使用自家Corojo烟叶" },
  { name: "Casa Turrent", nameCn: "卡萨图伦", description: "墨西哥最著名的雪茄品牌，六代烟草世家" },
  { name: "Kristoff", nameCn: "克里斯托弗", description: "多米尼加精品品牌，以浓郁复杂的口感著称" },
  { name: "Warped", nameCn: "茄卷", description: "由Kyle Gellis创立的新锐精品品牌" },
  { name: "Flor de Copan", nameCn: "科潘之花", description: "洪都拉斯品牌，以当地优质烟叶制作" },
  { name: "La Flor Dominicana", nameCn: "多米尼加之花", description: "多米尼加精品品牌，Andalusian Bull获年度雪茄" },
]

export default async function seedBrands({ container }: ExecArgs) {
  const brandService: BrandModuleService = container.resolve(BRAND_MODULE)

  // Check if brands already exist
  const existing = await brandService.listBrands({}, { take: 1 })
  if (existing.length > 0) {
    console.log("Brands already exist, skipping seed.")
    return
  }

  console.log("Seeding cigar brands...")

  const allBrands: Array<BrandDef & { origin: string }> = [
    ...cubanBrands.map((b) => ({ ...b, origin: "cuban" })),
    ...worldBrands.map((b) => ({ ...b, origin: "world" })),
  ]

  for (const brand of allBrands) {
    await brandService.createBrands({
      name: brand.name,
      description: `${brand.nameCn} - ${brand.description}`,
      logo_url: logoUrl(brand.name),
      origin: brand.origin,
    } as any)
  }

  console.log(
    `Seeded ${cubanBrands.length} Cuban brands and ${worldBrands.length} world brands (${allBrands.length} total).`
  )
}
