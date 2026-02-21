export interface Article {
  slug: string
  title: string
  excerpt: string
  content: string
  image: string
  category: "雪茄快訊" | "品味生活" | "品鑑指南" | "Podcast"
  date: string
  author: string
  readTime: string
}

export const articles: Article[] = [
  {
    slug: "guide-to-cuban-cigars",
    title: "古巴雪茄入門指南：從選購到品鑑的完整攻略",
    excerpt: "無論您是雪茄新手還是資深愛好者，了解古巴雪茄的基本知識都是品鑑之路的重要一步。本文將為您詳細介紹古巴雪茄的分類、選購技巧和品鑑方法。",
    content: `古巴雪茄被譽為雪茄界的「黃金標準」，其獨特的風土條件和百年製茄傳統造就了無與倫比的品質。\n\n## 古巴雪茄的分類\n\n古巴目前擁有 27 個活躍的雪茄品牌，每個品牌都有其獨特的風味定位。從入門級的 Jose L. Piedra 到頂級的 Cohiba Behike，價格和風味跨度極大。\n\n### 按強度分類\n\n- **輕度**：如 Hoyo de Monterrey、H. Upmann，適合初學者\n- **中度**：如 Montecristo、Romeo y Julieta，最受歡迎的強度\n- **濃度**：如 Partagas、Bolivar，適合有經驗的品鑑者\n\n## 選購技巧\n\n1. 觀察茄衣的光澤和一致性\n2. 輕捏雪茄感受其彈性\n3. 留意包裝的完整性和日期\n4. 選擇信譽良好的零售商\n\n## 品鑑方法\n\n剪茄、點燃、慢抽是品鑑雪茄的三個基本步驟。每一步都有其講究，掌握好這些技巧，您就能充分享受每一支雪茄帶來的獨特體驗。`,
    image: "/images/article-1.jpg",
    category: "品鑑指南",
    date: "2025-12-15",
    author: "TimeCigar 編輯部",
    readTime: "8 分鐘"
  },
  {
    slug: "cohiba-behike-story",
    title: "高希霸 Behike：古巴雪茄界的皇冠明珠",
    excerpt: "深入探索 Cohiba Behike 系列的傳奇故事，了解這款被譽為世界上最昂貴古巴雪茄的誕生歷程。",
    content: `Cohiba Behike 的名字來源於古巴原住民泰諾族（Taino）的酋長稱號，這個系列自 2010 年正式推出以來，一直是雪茄世界的聖杯。\n\n## 獨特之處\n\nBehike 系列最特別的地方在於使用了 Medio Tiempo 菸葉，這是煙草植株最頂端的兩片葉子，只有約 10% 的植株能長出這種菸葉。Medio Tiempo 的加入帶來了更加濃郁和複雜的風味。`,
    image: "/images/article-2.jpg",
    category: "雪茄快訊",
    date: "2025-11-28",
    author: "TimeCigar 編輯部",
    readTime: "6 分鐘"
  },
  {
    slug: "cigar-and-whisky-pairing",
    title: "雪茄與威士忌的完美搭配指南",
    excerpt: "探索雪茄與威士忌之間的奇妙化學反應，從風味配對到場景推薦，帶您領略這對經典組合的無限魅力。",
    content: `雪茄與威士忌的搭配是一門藝術，正確的組合能讓兩者的風味相互提升，達到 1+1 大於 2 的效果。\n\n## 搭配原則\n\n1. **強度匹配**：輕度雪茄配輕盈威士忌，濃度雪茄配厚重威士忌\n2. **風味互補**：帶有甜味的雪茄適合搭配帶有辛辣感的威士忌\n3. **產地呼應**：古巴雪茄與蘇格蘭威士忌是經典組合`,
    image: "/images/article-3.jpg",
    category: "品味生活",
    date: "2025-11-10",
    author: "TimeCigar 編輯部",
    readTime: "5 分鐘"
  },
  {
    slug: "limited-edition-2025",
    title: "2025 年度限量版雪茄盤點：最值得收藏的珍品",
    excerpt: "回顧 2025 年各大品牌推出的限量版雪茄，從古巴的 Edicion Limitada 到非古的年度特別版，為您精選最值得入手的珍藏之選。",
    content: `每年的限量版雪茄都是收藏家和品鑑者最期待的盛事。2025 年各大品牌依舊帶來了令人驚艷的作品。\n\n## 古巴限量版\n\n今年的 Edicion Limitada 延續了一貫的高水準，其中最引人注目的是 Cohiba 和 Montecristo 的特別版。\n\n## 非古限量版\n\nDavidoff、Padron 和 Arturo Fuente 也推出了各自的年度特別版，每一款都展現了品牌的最高工藝水準。`,
    image: "/images/hero-1.jpg",
    category: "雪茄快訊",
    date: "2025-10-20",
    author: "TimeCigar 編輯部",
    readTime: "7 分鐘"
  },
  {
    slug: "how-to-store-cigars",
    title: "雪茄保存完全指南：從保濕盒到窖藏的秘訣",
    excerpt: "正確的保存方式是享受優質雪茄的關鍵。學習如何選擇和維護保濕盒，掌握最佳的溫濕度控制技巧。",
    content: `雪茄是一種活的產品，需要適當的環境條件才能保持最佳狀態。理想的保存條件是溫度 16-18°C，相對濕度 65-70%。\n\n## 選擇保濕盒\n\n一個好的保濕盒是雪茄保存的基礎。西班牙雪松木製成的保濕盒是最佳選擇，它不僅能調節濕度，還能為雪茄增添淡淡的木質香氣。`,
    image: "/images/article-1.jpg",
    category: "品鑑指南",
    date: "2025-09-15",
    author: "TimeCigar 編輯部",
    readTime: "6 分鐘"
  },
  {
    slug: "beginner-first-cigar",
    title: "新手第一支雪茄怎麼選？五款入門首選推薦",
    excerpt: "剛開始接觸雪茄的朋友往往不知從何入手。本文為您精選五款最適合新手的雪茄，幫助您開啟品鑑之旅。",
    content: `選擇第一支雪茄時，最重要的原則是從輕度到中度的雪茄開始。過於濃烈的雪茄可能會讓初學者產生不適感。\n\n## 推薦清單\n\n1. **Hoyo de Monterrey Epicure No.2** - 中等強度，風味均衡\n2. **Romeo y Julieta Short Churchill** - 輕度至中度，花香優雅\n3. **Montecristo No.4** - 經典入門之選\n4. **Davidoff Aniversario No.3** - 優雅精緻的非古選擇\n5. **Villiger Premium No.1** - 迷你雪茄入門首選`,
    image: "/images/article-2.jpg",
    category: "品鑑指南",
    date: "2025-08-22",
    author: "TimeCigar 編輯部",
    readTime: "5 分鐘"
  },
]

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find(a => a.slug === slug)
}

export function getArticlesByCategory(category: string): Article[] {
  if (category === "全部") return articles
  return articles.filter(a => a.category === category)
}
