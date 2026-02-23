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
    excerpt: "剛開始接觸雪茄的朋友往往不知從何入手。本文從選購原則、強度認識到具體推薦，為您精選五款最適合新手的雪茄，並附上完整的剪茄、點燃與品鑑教學，幫助您從零開啟品鑑之旅。",
    content: `選擇第一支雪茄是品鑑之路的起點，也是最讓人迷茫的一步。市面上數以百計的品牌和型號，價格從數十元到數千元不等，新手往往不知該如何下手。別擔心，跟著這篇指南，我們將從最基本的概念開始，一步步帶您找到屬於自己的第一支好茄。\n\n## 選購前必知：認識雪茄強度\n\n雪茄的強度（Strength）是新手選購時最重要的參考指標。強度主要取決於菸葉的類型和配方比例：\n\n- **輕度（Mild）**：煙氣柔和順滑，適合完全沒有經驗的初學者。代表風味包括奶油、蜂蜜、堅果等\n- **中度（Medium）**：風味層次更加豐富，帶有木質、咖啡等基調。適合抽過幾支輕度雪茄後的進階者\n- **中強（Medium-Full）**：風味濃郁飽滿，帶有皮革、可可、辛香料等風味。需要一定的品鑑經驗\n- **強度（Full）**：煙氣強勁，風味極其複雜。建議有至少半年以上品鑑經驗後再嘗試\n\n### 新手的黃金法則\n\n從輕度到中度開始，循序漸進。過於濃烈的雪茄不僅無法讓初學者享受其複雜風味，反而可能帶來暈眩和不適感。\n\n## 選購雪茄的四個要點\n\n1. **觀察外觀**：好的雪茄表面應光滑油潤，茄衣色澤均勻無明顯裂痕或斑點\n2. **輕捏觸感**：用拇指和食指輕輕捏壓雪茄，應有適度的彈性回饋。太硬說明受潮不足，太軟則可能過度受潮\n3. **聞香辨質**：未點燃的雪茄應散發出乾淨的菸草香氣，若有刺鼻或霉味則表示保存不當\n4. **選對尺寸**：新手建議從 Robusto（長約 127mm，環徑 50）或 Corona（長約 143mm，環徑 42）等中等尺寸開始，品鑑時間約 45-60 分鐘，不會太短也不至太長\n\n## 五款入門首選推薦\n\n1. **Hoyo de Monterrey Epicure No.2** - 中等強度，風味均衡，帶有奶油和木質的柔和基調。被譽為「最佳入門古巴雪茄」，價格適中，品質穩定。Robusto 尺寸（124mm x 50），品鑑時間約 50 分鐘\n2. **Romeo y Julieta Short Churchill** - 輕度至中度，花香優雅，甜美順滑。羅密歐品牌歷史悠久，這款短邱吉爾是進入古巴雪茄世界的絕佳敲門磚\n3. **Montecristo No.4** - 全球銷量第一的古巴雪茄型號，經典入門之選。中等強度，帶有標誌性的咖啡和堅果風味，品質始終如一\n4. **Davidoff Aniversario No.3** - 來自多明尼加的非古選擇，優雅精緻。使用厄瓜多爾 Connecticut 茄衣，口感柔順如絲，適合偏好輕柔風格的新手\n5. **Cohiba Club（迷你雪茄）** - 如果您不確定是否喜歡雪茄，可以先從高希霸俱樂部這款迷你雪茄開始。品鑑時間僅需 15-20 分鐘，讓您以最低成本體驗頂級品牌的魅力\n\n## 新手品鑑三步驟\n\n### 第一步：剪茄\n\n使用專業雪茄剪（推薦直剪式），在雪茄帽端約 2-3mm 處果斷一剪。剪口要乾淨利落，避免反覆剪切導致茄衣破裂。\n\n### 第二步：點燃\n\n使用無味燃料的打火機或雪松木片。將火焰靠近雪茄底端，緩慢旋轉，讓整個截面均勻受熱。注意不要讓火焰直接接觸雪茄——用熱量烘烤而非燒烤。\n\n### 第三步：慢抽品味\n\n每 30-60 秒抽一口，讓煙氣在口腔中停留片刻後緩緩吐出。雪茄煙氣不需要吸入肺部，用口腔和鼻腔感受風味即可。留意每一口之間風味的微妙變化——這正是品鑑雪茄最迷人的地方。\n\n## 搭配建議\n\n初學者可以搭配以下飲品，提升品鑑體驗：\n\n- **美式咖啡**：咖啡的苦味與雪茄的木質風味相得益彰\n- **清水**：最純粹的搭配，能讓您清晰感受每一口的風味變化\n- **朗姆可樂**：甜味飲品可以緩和雪茄的辛辣感，適合剛入門的朋友\n- **單一麥芽威士忌**：進階搭配，威士忌的麥芽甜味與雪茄形成美妙平衡`,
    image: "/images/beginner-guide.jpg",
    category: "品鑑指南",
    date: "2025-08-22",
    author: "TimeCigar 編輯部",
    readTime: "12 分鐘"
  },
]

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find(a => a.slug === slug)
}

export function getArticlesByCategory(category: string): Article[] {
  if (category === "全部") return articles
  return articles.filter(a => a.category === category)
}
