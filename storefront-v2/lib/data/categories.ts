export interface Brand {
  name: string
  nameEn: string
  slug: string
  logo?: string
}

export interface Category {
  slug: string
  name: string
  nameEn: string
  description: string
  image: string
  subLinks?: { label: string; href: string }[]
  brands: Brand[]
}

/* ---------- API types ---------- */

export interface MedusaCategory {
  id: string
  name: string
  handle: string
  description: string | null
  parent_category: MedusaCategory | null
  category_children: MedusaCategory[]
  metadata: Record<string, unknown> | null
}

interface CategoryListResponse {
  product_categories: MedusaCategory[]
  count: number
  offset: number
  limit: number
}

/* ---------- API fetchers ---------- */

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

async function medusaFetch<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {}
  if (PUBLISHABLE_KEY) {
    headers["x-publishable-api-key"] = PUBLISHABLE_KEY
  }
  const res = await fetch(`${MEDUSA_BACKEND_URL}${path}`, {
    headers,
    next: { revalidate: 30 },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

/**
 * Fetch a product category by handle from Medusa Store API.
 */
export async function fetchCategoryByHandle(handle: string): Promise<MedusaCategory | null> {
  try {
    const data = await medusaFetch<CategoryListResponse>(
      `/store/product-categories?handle=${encodeURIComponent(handle)}&fields=id,name,handle,description,metadata`
    )
    return data?.product_categories?.[0] ?? null
  } catch {
    return null
  }
}

export const categories: Category[] = [
  {
    slug: "cuban-cigars",
    name: "古巴雪茄",
    nameEn: "Cuban Cigars",
    description: "探索來自古巴的頂級雪茄品牌，包括高希霸、蒙特克里斯托、帕特加斯等經典品牌。每一支都承載著古巴百年的製茄傳統與工藝。",
    image: "/images/hero-1.jpg",
    subLinks: [
      { label: "焦點推介", href: "/category/cuban-cigars?filter=featured" },
      { label: "古巴珍藏閣", href: "/category/cuban-cigars?filter=vintage" },
      { label: "陳年雪茄", href: "/category/cuban-cigars?filter=aged" },
      { label: "所有商品", href: "/category/cuban-cigars" },
    ],
    brands: [
      { name: "保利華", nameEn: "Bolivar", slug: "bolivar", logo: "B" },
      { name: "高希霸", nameEn: "Cohiba", slug: "cohiba", logo: "C" },
      { name: "庫阿巴", nameEn: "Cuaba", slug: "cuaba", logo: "Cu" },
      { name: "外交官", nameEn: "Diplomaticos", slug: "diplomaticos", logo: "D" },
      { name: "豐塞卡", nameEn: "Fonseca", slug: "fonseca", logo: "F" },
      { name: "優名", nameEn: "H. Upmann", slug: "h-upmann", logo: "HU" },
      { name: "好友", nameEn: "Hoyo de Monterrey", slug: "hoyo", logo: "H" },
      { name: "比雅達", nameEn: "Jose L. Piedra", slug: "jose-piedra", logo: "JP" },
      { name: "胡安·洛佩斯", nameEn: "Juan Lopez", slug: "juan-lopez", logo: "JL" },
      { name: "蒙特", nameEn: "Montecristo", slug: "montecristo", logo: "M" },
      { name: "帕特加斯", nameEn: "Partagas", slug: "partagas", logo: "P" },
      { name: "波爾·拉臘尼亞加", nameEn: "Por Larranaga", slug: "por-larranaga", logo: "PL" },
      { name: "潘趣", nameEn: "Punch", slug: "punch", logo: "Pu" },
      { name: "多爾塞", nameEn: "Quai d'Orsay", slug: "quai-dorsay", logo: "Q" },
      { name: "金特羅", nameEn: "Quintero", slug: "quintero", logo: "Qi" },
      { name: "拉斐爾", nameEn: "Rafael Gonzalez", slug: "rafael-gonzalez", logo: "RG" },
      { name: "萊蒙·阿隆尼", nameEn: "Ramon Allones", slug: "ramon-allones", logo: "RA" },
      { name: "羅密歐·朱麗葉", nameEn: "Romeo y Julieta", slug: "romeo-y-julieta", logo: "RJ" },
      { name: "聖路易斯·雷伊", nameEn: "Saint Luis Rey", slug: "saint-luis-rey", logo: "SL" },
      { name: "聖克里斯多", nameEn: "San Cristobal", slug: "san-cristobal", logo: "SC" },
      { name: "特立尼達", nameEn: "Trinidad", slug: "trinidad", logo: "T" },
      { name: "瓦格斯·陸班納", nameEn: "Vegas Robaina", slug: "vegas-robaina", logo: "VR" },
      { name: "威古洛", nameEn: "Vegueros", slug: "vegueros", logo: "Ve" },
    ]
  },
  {
    slug: "world-cigars",
    name: "世界品牌",
    nameEn: "World Cigars",
    description: "精選來自多明尼加、尼加拉瓜、洪都拉斯等地的優質雪茄，涵蓋大衛杜夫、富恩特等世界級品牌。",
    image: "/images/hero-2.jpg",
    subLinks: [
      { label: "焦點推介", href: "/category/world-cigars?filter=featured" },
      { label: "限量系列", href: "/category/world-cigars?filter=limited" },
      { label: "所有商品", href: "/category/world-cigars" },
    ],
    brands: [
      { name: "唯佳", nameEn: "VegaFina", slug: "vegafina", logo: "VF" },
      { name: "紫檀葉", nameEn: "Aganorsa Leaf", slug: "aganorsa", logo: "AG" },
      { name: "AJ費爾南德斯", nameEn: "AJ Fernandez", slug: "aj-fernandez", logo: "AJ" },
      { name: "阿拉丁", nameEn: "Aladino", slug: "aladino", logo: "Al" },
      { name: "埃芬巴", nameEn: "Alfambra", slug: "alfambra", logo: "Af" },
      { name: "阿圖羅·富恩特", nameEn: "Arturo Fuente", slug: "arturo-fuente", logo: "AF" },
      { name: "阿什頓", nameEn: "Ashton", slug: "ashton", logo: "As" },
      { name: "卡馬喬", nameEn: "Camacho", slug: "camacho", logo: "Ca" },
      { name: "大衛杜夫", nameEn: "Davidoff", slug: "davidoff", logo: "Dv" },
      { name: "德魯莊園", nameEn: "Drew Estate", slug: "drew-estate", logo: "DE" },
      { name: "廓爾喀", nameEn: "Gurkha", slug: "gurkha", logo: "G" },
      { name: "尼加拉瓜珍寶", nameEn: "Joya De Nicaragua", slug: "joya-de-nicaragua", logo: "JN" },
      { name: "克里斯托弗", nameEn: "Kristoff", slug: "kristoff", logo: "K" },
      { name: "我的父親", nameEn: "My Father", slug: "my-father", logo: "MF" },
      { name: "奧利瓦", nameEn: "Oliva", slug: "oliva", logo: "O" },
      { name: "帕德龍", nameEn: "Padron", slug: "padron", logo: "Pd" },
      { name: "帕拉森", nameEn: "Plasencia", slug: "plasencia", logo: "Pl" },
      { name: "洛基·帕特爾", nameEn: "Rocky Patel", slug: "rocky-patel", logo: "RP" },
    ]
  },
  {
    slug: "mini-cigars",
    name: "古巴小雪茄",
    nameEn: "Cuban Mini Cigars",
    description: "輕巧便攜的古巴小雪茄系列，適合忙碌的都市生活。短時間即可享受高品質的雪茄體驗。",
    image: "/images/hero-3.jpg",
    subLinks: [
      { label: "焦點推介", href: "/category/mini-cigars?filter=featured" },
      { label: "所有商品", href: "/category/mini-cigars" },
    ],
    brands: [
      { name: "高希霸", nameEn: "Cohiba", slug: "cohiba-mini", logo: "C" },
      { name: "關達拉美拉", nameEn: "Guantanamera", slug: "guantanamera", logo: "Gu" },
      { name: "蒙特", nameEn: "Montecristo", slug: "montecristo-mini", logo: "M" },
      { name: "帕特加斯", nameEn: "Partagas", slug: "partagas-mini", logo: "P" },
      { name: "羅密歐·朱麗葉", nameEn: "Romeo y Julieta", slug: "romeo-mini", logo: "RJ" },
      { name: "特立尼達", nameEn: "Trinidad", slug: "trinidad-mini", logo: "T" },
    ]
  },
  {
    slug: "pipe-tobacco",
    name: "煙斗煙絲",
    nameEn: "Pipe Tobacco",
    description: "精選來自世界各地的優質煙斗煙絲品牌，為煙斗注入真正的靈魂享受。",
    image: "/images/product-4.jpg",
    subLinks: [
      { label: "配件", href: "/category/pipe-tobacco?type=accessories" },
      { label: "所有商品", href: "/category/pipe-tobacco" },
    ],
    brands: [
      { name: "康奈爾與迪爾", nameEn: "Cornell & Diehl", slug: "cornell-diehl", logo: "CD" },
      { name: "大衛杜夫", nameEn: "Davidoff", slug: "davidoff-pipe", logo: "Dv" },
      { name: "艾林摩爾", nameEn: "Erinmore", slug: "erinmore", logo: "Er" },
      { name: "皮斯", nameEn: "G.L. Pease", slug: "gl-pease", logo: "GL" },
      { name: "馬垻", nameEn: "Mac Baren", slug: "mac-baren", logo: "MB" },
      { name: "法官", nameEn: "Orlik", slug: "orlik", logo: "Or" },
      { name: "彼得森", nameEn: "Peterson", slug: "peterson", logo: "Pe" },
      { name: "保羅溫斯洛", nameEn: "Poul Winslow", slug: "poul-winslow", logo: "PW" },
      { name: "拉特雷", nameEn: "Rattray's", slug: "rattrays", logo: "Rt" },
      { name: "羅伯特麥康奈爾", nameEn: "Robert McConnell", slug: "robert-mcconnell", logo: "RM" },
      { name: "塞繆爾加維", nameEn: "Samuel Gawith", slug: "samuel-gawith", logo: "SG" },
      { name: "華雲", nameEn: "Vauen", slug: "vauen", logo: "Va" },
      { name: "拉森", nameEn: "W.O.LARSEN", slug: "wo-larsen", logo: "WL" },
    ]
  },
  {
    slug: "accessories",
    name: "雪茄配件",
    nameEn: "Accessories",
    description: "精選雪茄剪、打火機、保濕盒等專業配件，為您的雪茄體驗增添品味。",
    image: "/images/product-5.jpg",
    subLinks: [
      { label: "所有商品", href: "/category/accessories" },
    ],
    brands: []
  }
]

export const accessorySubItems = [
  { label: "Cohiba", labelZh: "高希霸", slug: "cohiba" },
  { label: "S.T. Dupont", labelZh: "法國都彭", slug: "st-dupont" },
  { label: "Ashtrays", labelZh: "煙缸", slug: "ashtrays" },
  { label: "Cigar Cases", labelZh: "雪茄套", slug: "cigar-cases" },
  { label: "Cutters", labelZh: "雪茄剪", slug: "cutters" },
  { label: "Humidors", labelZh: "雪茄保濕箱", slug: "humidors" },
  { label: "Lighters", labelZh: "打火機", slug: "lighters" },
  { label: "Other", labelZh: "其他配件", slug: "other" },
]

export const promotionLinks = [
  { label: "駿馬迎新", href: "/category/cuban-cigars?promo=newyear" },
  { label: "特選古巴雪茄新春獻禮", href: "/category/cuban-cigars?promo=gift" },
  { label: "古巴小雪茄 | 喜迎新歲鉅獻", href: "/category/mini-cigars?promo=newyear" },
  { label: "暢享名茄禮遇 共赴新年駿程", href: "/category/world-cigars?promo=newyear" },
  { label: "福馬迎春 | 精選馬年限量禮盒巡禮", href: "/category/cuban-cigars?filter=limited" },
  { label: "精選紅色禮盒", href: "/category/cuban-cigars?promo=red-gift" },
]

export const vipLinks = [
  { label: "【鉑金會員專享】每週會員專屬禮遇", href: "/category/cuban-cigars?vip=platinum" },
  { label: "【黃金會員專享】每週會員專屬禮遇", href: "/category/cuban-cigars?vip=gold-weekly" },
  { label: "【黃金 / 鉑金會員專享】古巴羅伯圖精選", href: "/category/cuban-cigars?vip=gold" },
]

export const brandPromoLinks = [
  { label: "奧利瓦 | 匠人精選 低至7折", href: "/category/world-cigars?brand=oliva" },
  { label: "大衛杜夫 | 尊貴精選 禮遇9折起", href: "/category/world-cigars?brand=davidoff" },
  { label: "唯佳 | 大師級呈獻 限時7折起", href: "/category/world-cigars?brand=vegafina" },
  { label: "阿拉丁 | 經典風味 低至65折", href: "/category/world-cigars?brand=aladino" },
]

export const cigarFeatureLinks = [
  { label: "煙斗煙絲 | 低至6折獨家優惠", href: "/category/pipe-tobacco?promo=sale" },
  { label: "精選雪茄套裝", href: "/category/cuban-cigars?filter=combo" },
  { label: "品鑑套裝 | 探索風味光譜", href: "/category/world-cigars?filter=sampler" },
]

export const newArrivalLinks = [
  { label: "Capitol Art Deco 限量版 全新到貨", href: "/product/capitol-art-deco" },
  { label: "高希霸 短號 馬年 2025限量版", href: "/product/cohiba-short-horse-2025" },
]

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find(c => c.slug === slug)
}
