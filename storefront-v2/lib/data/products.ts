export interface Product {
  id: string
  name: string
  nameEn: string
  brand: string
  brandEn: string
  category: string
  price: number
  originalPrice?: number
  image: string
  images?: string[]
  description: string
  origin: string
  wrapper: string
  binder: string
  filler: string
  strength: "輕" | "中" | "中強" | "強"
  length: string
  ringGauge: string
  packSize: number
  inStock: boolean
  isNew?: boolean
  isLimited?: boolean
  isFeatured?: boolean
  tastingNotes?: string
  pairingNotes?: string
}

export const products: Product[] = [
  {
    id: "cohiba-siglo-vi",
    name: "高希霸 世紀六號",
    nameEn: "Cohiba Siglo VI",
    brand: "高希霸",
    brandEn: "Cohiba",
    category: "cuban-cigars",
    price: 4280,
    image: "/images/product-1.jpg",
    images: ["/images/product-1.jpg", "/images/product-2.jpg", "/images/product-3.jpg"],
    description: "Cohiba Siglo VI 是高希霸世紀系列中最具代表性的作品，以其飽滿的口感和複雜的風味層次聞名於世。這款雪茄採用古巴最優質的菸葉，經過嚴格的發酵和陳化工序，帶來無與倫比的品鑑體驗。",
    origin: "古巴",
    wrapper: "古巴",
    binder: "古巴",
    filler: "古巴",
    strength: "中強",
    length: "150mm",
    ringGauge: "52",
    packSize: 25,
    inStock: true,
    isFeatured: true,
    tastingNotes: "開啟時帶有雪松木和皮革的香氣，隨著燃燒逐漸展現出咖啡、可可和黑巧克力的複雜風味。中段出現淡淡的胡椒和肉桂辛香，尾段回歸柔順的奶油和堅果餘韻。",
    pairingNotes: "建議搭配單一麥芽威士忌、陳年干邑白蘭地或優質濃縮咖啡。也適合搭配70%以上的黑巧克力。"
  },
  {
    id: "cohiba-behike-56",
    name: "高希霸 BHK 56",
    nameEn: "Cohiba Behike 56",
    brand: "高希霸",
    brandEn: "Cohiba",
    category: "cuban-cigars",
    price: 8800,
    image: "/images/product-2.jpg",
    images: ["/images/product-2.jpg", "/images/product-1.jpg"],
    description: "Cohiba Behike 56 是高希霸最頂級的系列，使用了極為罕見的 Medio Tiempo 菸葉，每年產量極為有限。",
    origin: "古巴",
    wrapper: "古巴",
    binder: "古巴",
    filler: "古巴 (含 Medio Tiempo)",
    strength: "強",
    length: "166mm",
    ringGauge: "56",
    packSize: 10,
    inStock: true,
    isLimited: true,
    isFeatured: true,
    tastingNotes: "極其豐富的風味層次，從泥土和皮革的基調開始，展現出咖啡、黑巧克力和烘烤堅果的深邃味道。",
    pairingNotes: "適合搭配頂級陳年威士忌或珍藏級干邑。"
  },
  {
    id: "montecristo-no2",
    name: "蒙特克里斯托 二號",
    nameEn: "Montecristo No.2",
    brand: "蒙特克里斯托",
    brandEn: "Montecristo",
    category: "cuban-cigars",
    price: 2180,
    image: "/images/product-3.jpg",
    images: ["/images/product-3.jpg", "/images/product-1.jpg"],
    description: "Montecristo No.2 是全球最受歡迎的魚雷型雪茄之一，被譽為古巴雪茄的經典之作。",
    origin: "古巴",
    wrapper: "古巴",
    binder: "古巴",
    filler: "古巴",
    strength: "中強",
    length: "156mm",
    ringGauge: "52",
    packSize: 25,
    inStock: true,
    isFeatured: true,
    tastingNotes: "開啟時有明顯的雪松和堅果香氣，中段展現出咖啡和可可風味，收尾帶有甜蜜的木質餘韻。",
    pairingNotes: "經典搭配是陳年朗姆酒或波本威士忌。"
  },
  {
    id: "partagas-serie-d-no4",
    name: "帕特加斯 D系列 四號",
    nameEn: "Partagas Serie D No.4",
    brand: "帕特加斯",
    brandEn: "Partagas",
    category: "cuban-cigars",
    price: 1680,
    image: "/images/product-4.jpg",
    images: ["/images/product-4.jpg", "/images/product-1.jpg"],
    description: "Partagas Serie D No.4 是帕特加斯品牌的標誌性產品，以其強勁飽滿的口感著稱。",
    origin: "古巴",
    wrapper: "古巴",
    binder: "古巴",
    filler: "古巴",
    strength: "強",
    length: "124mm",
    ringGauge: "50",
    packSize: 25,
    inStock: true,
    tastingNotes: "濃郁的泥土和皮革風味，帶有辛辣的胡椒和深沉的咖啡基調。",
    pairingNotes: "適合搭配濃烈的紅酒或陳年白蘭地。"
  },
  {
    id: "romeo-y-julieta-wide-churchill",
    name: "羅密歐與朱麗葉 寬邱吉爾",
    nameEn: "Romeo y Julieta Wide Churchill",
    brand: "羅密歐與朱麗葉",
    brandEn: "Romeo y Julieta",
    category: "cuban-cigars",
    price: 1980,
    image: "/images/product-5.jpg",
    images: ["/images/product-5.jpg", "/images/product-1.jpg"],
    description: "寬邱吉爾是羅密歐與朱麗葉品牌的現代經典，較傳統邱吉爾更寬的環徑帶來更豐富的煙霧量。",
    origin: "古巴",
    wrapper: "古巴",
    binder: "古巴",
    filler: "古巴",
    strength: "中",
    length: "130mm",
    ringGauge: "55",
    packSize: 25,
    inStock: true,
    tastingNotes: "柔和的花香和蜂蜜開場，隨後展現杏仁和奶油風味。",
    pairingNotes: "搭配香檳或輕盈的白葡萄酒尤為出色。"
  },
  {
    id: "bolivar-belicosos-finos",
    name: "玻利瓦爾 精選魚雷",
    nameEn: "Bolivar Belicosos Finos",
    brand: "玻利瓦爾",
    brandEn: "Bolivar",
    category: "cuban-cigars",
    price: 1880,
    image: "/images/product-1.jpg",
    images: ["/images/product-1.jpg"],
    description: "Bolivar Belicosos Finos 是玻利瓦爾品牌中最受追捧的型號，以其強勁而複雜的風味聞名。",
    origin: "古巴",
    wrapper: "古巴",
    binder: "古巴",
    filler: "古巴",
    strength: "強",
    length: "140mm",
    ringGauge: "52",
    packSize: 25,
    inStock: true,
    tastingNotes: "從一開始就展現出強烈的泥土和黑胡椒風味，逐步發展出深沉的可可和咖啡底蘊。",
    pairingNotes: "適合搭配泥煤味威士忌或陳年波特酒。"
  },
  {
    id: "davidoff-aniversario-no3",
    name: "大衛杜夫 週年慶三號",
    nameEn: "Davidoff Aniversario No.3",
    brand: "大衛杜夫",
    brandEn: "Davidoff",
    category: "world-cigars",
    price: 2680,
    image: "/images/product-3.jpg",
    images: ["/images/product-3.jpg"],
    description: "Davidoff Aniversario No.3 採用多明尼加最優質的菸葉，展現品牌一貫的精緻與優雅。",
    origin: "多明尼加",
    wrapper: "厄瓜多爾 Connecticut",
    binder: "多明尼加",
    filler: "多明尼加",
    strength: "中",
    length: "152mm",
    ringGauge: "50",
    packSize: 10,
    inStock: true,
    isFeatured: true,
    tastingNotes: "優雅的奶油和白胡椒開場，中段展現出杏仁和蜂蜜的甜美風味。",
    pairingNotes: "搭配優質香檳或輕盈的干邑白蘭地。"
  },
  {
    id: "arturo-fuente-opus-x",
    name: "阿圖羅·富恩特 Opus X",
    nameEn: "Arturo Fuente Opus X",
    brand: "富恩特",
    brandEn: "Arturo Fuente",
    category: "world-cigars",
    price: 3280,
    image: "/images/product-4.jpg",
    images: ["/images/product-4.jpg"],
    description: "Opus X 是富恩特家族的巔峰之作，使用了極其罕見的多明尼加種植的茄衣菸葉。",
    origin: "多明尼加",
    wrapper: "多明尼加 Rosado",
    binder: "多明尼加",
    filler: "多明尼加",
    strength: "中強",
    length: "149mm",
    ringGauge: "46",
    packSize: 10,
    inStock: true,
    isLimited: true,
    tastingNotes: "辛香料和皮革的強烈開場，過渡到甜美的櫻桃和黑巧克力中段。",
    pairingNotes: "適合搭配陳年朗姆酒或單一麥芽威士忌。"
  },
  {
    id: "villiger-premium-no1",
    name: "威力格 精選一號",
    nameEn: "Villiger Premium No.1",
    brand: "威力格",
    brandEn: "Villiger",
    category: "mini-cigars",
    price: 280,
    image: "/images/product-5.jpg",
    images: ["/images/product-5.jpg"],
    description: "Villiger Premium No.1 是瑞士品牌威力格的經典迷你雪茄，輕盈順滑，適合日常品鑑。",
    origin: "瑞士/印尼",
    wrapper: "蘇門答臘",
    binder: "印尼",
    filler: "混合",
    strength: "輕",
    length: "100mm",
    ringGauge: "30",
    packSize: 20,
    inStock: true,
    tastingNotes: "輕柔的木質和淡淡的甜味，非常順滑的抽吸體驗。",
    pairingNotes: "適合搭配美式咖啡或清淡的綠茶。"
  },
  {
    id: "cohiba-club",
    name: "高希霸 俱樂部",
    nameEn: "Cohiba Club",
    brand: "高希霸",
    brandEn: "Cohiba",
    category: "mini-cigars",
    price: 480,
    image: "/images/product-2.jpg",
    images: ["/images/product-2.jpg"],
    description: "Cohiba Club 是高希霸推出的迷你雪茄系列，保持了品牌的高品質標準，同時提供更便捷的品鑑體驗。",
    origin: "古巴",
    wrapper: "古巴",
    binder: "古巴",
    filler: "古巴",
    strength: "輕",
    length: "88mm",
    ringGauge: "22",
    packSize: 20,
    inStock: true,
    tastingNotes: "輕盈的咖啡和奶油風味，帶有微妙的甜味。",
    pairingNotes: "適合搭配濃縮咖啡或甜點。"
  },
  {
    id: "hoyo-epicure-no2",
    name: "荷約·蒙特雷 精選二號",
    nameEn: "Hoyo de Monterrey Epicure No.2",
    brand: "荷約",
    brandEn: "Hoyo de Monterrey",
    category: "cuban-cigars",
    price: 1580,
    image: "/images/product-3.jpg",
    images: ["/images/product-3.jpg"],
    description: "Epicure No.2 是荷約品牌最暢銷的型號，以其平衡的中等強度和優雅的風味著稱。",
    origin: "古巴",
    wrapper: "古巴",
    binder: "古巴",
    filler: "古巴",
    strength: "中",
    length: "124mm",
    ringGauge: "50",
    packSize: 25,
    inStock: true,
    tastingNotes: "柔順的奶油和木質基調，伴隨淡淡的堅果和蜂蜜風味。",
    pairingNotes: "搭配清爽的白葡萄酒或淡雅的日本威士忌。"
  },
  {
    id: "trinidad-fundadores",
    name: "千里達 創始者",
    nameEn: "Trinidad Fundadores",
    brand: "千里達",
    brandEn: "Trinidad",
    category: "cuban-cigars",
    price: 3680,
    image: "/images/product-4.jpg",
    images: ["/images/product-4.jpg"],
    description: "Trinidad Fundadores 曾是古巴政府專供外交禮品的雪茄，如今已成為古巴最珍貴的雪茄之一。",
    origin: "古巴",
    wrapper: "古巴",
    binder: "古巴",
    filler: "古巴",
    strength: "中",
    length: "192mm",
    ringGauge: "40",
    packSize: 24,
    inStock: true,
    isLimited: true,
    isFeatured: true,
    tastingNotes: "優雅的花香和甜美的木質開場，發展出深邃的咖啡和巧克力風味。",
    pairingNotes: "建議搭配頂級干邑或陳年雪莉酒。"
  },
]

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id)
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter(p => p.category === category)
}

export function getFeaturedProducts(): Product[] {
  return products.filter(p => p.isFeatured)
}

export function getLimitedProducts(): Product[] {
  return products.filter(p => p.isLimited)
}
