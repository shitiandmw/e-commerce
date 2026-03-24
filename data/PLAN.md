# 商品数据导入计划

## 数据文件

所有数据文件位于 `data/` 目录。

| 文件 | 说明 | 数量 |
|------|------|------|
| `brands.csv` | 品牌定义 | 36 个 |
| `categories.csv` | 商品分类（两层树） | 38 个 |
| `menu_items.csv` | 菜单项（含嵌套关系） | 45 项 |
| `products.csv` | 待导入商品 | 429 条 |
| `products_with_urls.csv` | 商品含生产环境图片URL | 429 条 |
| `image_url_map.json` | 图片本地路径→远程URL映射 | 713 条 |

---

## 数据结构

### 品牌 (brands.csv)

| 字段 | 说明 |
|------|------|
| `brand_cn` | 品牌中文名 |
| `brand_en` | 品牌英文名 |
| `origin` | `cuban` / `non_cuban` |
| `slug` | URL slug，用于分类页路由 |
| `product_count` | 关联商品数量（参考） |

**古巴品牌 (29 个)**：`大衛杜夫`, `玻利瓦爾`, `多爾賽碼頭`, `高希霸`, `好友`, `羅伯圖精選`, `羅密歐`, `蒙特`, `帕特加斯`, `千里達`, `烏普曼`, `波爾`, `胡安`, `潘趣`, `威古洛`, `古巴榮耀`, `雷蒙`, `庫阿巴`, `羅賓納`, `金特羅`, `拉斐爾`, `世界之王`, `比亞達`, `外交官`, `聖克里斯托`, `桑丘潘沙`, `聖路易斯.雷伊`, `豐塞卡`, `卡諾之花`

**非古品牌 (7 个)**：`簡單 (Sencillo)`, `火神 (God of Fire)`, `阿图罗·富恩特 (Arturo Fuente)`, `富恩特 (Arturo Fuente)`, `大卫杜夫 (Davidoff)`, `维佳 (VegaFina)`, `帕拉森 (Plasencia)`

### 分类 (categories.csv)

两级树结构：

```
古巴雪茄 (cigar-cuban)
  └── [29个品牌子分类]

非古巴雪茄 (cigar-world)
  └── [7个品牌子分类]
```

每个品牌分类 slug 对应 URL `/category/{slug}`，如 `/category/cohiba`

### 菜单 (menu_items.csv)

主导航菜单，通过 `parent_label` 字段建立嵌套关系：

| 一级项 | 二级项（品牌子菜单） |
|--------|---------------------|
| 古巴雪茄 | 29 个古巴品牌 |
| 非古巴雪茄 | 7 个非古品牌 |
| 雪茄配件 | — |
| 新品上市 | — |
| 特惠专区 | — |
| 雪茄知识 | 入门指南 / 品鉴技巧 / 保养存储 |

### 商品 (products.csv)

| 字段 | 说明 |
|------|------|
| `brand_cn` / `brand_en` | 品牌 |
| `brand_slug` | 品牌 slug |
| `title` | 商品标题（中文+英文型号） |
| `price_hkd` | 港币价格 |
| `length_mm` / `ring_gauge` | 尺寸（部分商品缺失） |
| `handle` | 商品 URL handle |
| `category_slug` | 归属品牌分类 slug |
| `cuban_parent_slug` | 固定 `cigar-cuban`（用于同时挂两个分类） |
| `image1~5` | 已替换为生产环境远程 URL |

**图片状态**（已上传完成）：
- 713 张真实图片：`https://api.shangjiacigar.com/static/...`
- 占位图：`https://api.shangjiacigar.com/static/1774260606710-placeholder.png`

---

## 实施步骤

### Step 1：清空现有数据（线上环境）

顺序：商品 → 品牌 → 分类（避免外键关联报错）

1. **删除所有现有商品**：`GET /admin/products?limit=100` 获取列表，逐条 `DELETE /admin/products/:id`
2. **删除所有品牌**：`GET /admin/brands` 获取列表，逐条 `DELETE /admin/brands/:id`
3. **删除所有商品分类**：`GET /admin/product-categories` 获取列表，逐条 `DELETE /admin/product-categories/:id`

> ⚠️ 删除前无需备份，原始数据在 CSV 文件中。

---

### Step 2：导入品牌

```
POST /admin/brands
Body: { name, description, logo_url, origin }
```

从 `data/brands.csv` 逐条创建。建立 `name → brand_id` 映射供后续使用。

**品牌描述**：从 `src/scripts/seed-brands.ts` 复用 29 个古巴品牌描述；7 个非古品牌使用简化描述。

---

### Step 3：创建分类

```
POST /admin/product-categories
Body: { name, handle, is_active, parent_category_id? }
```

顺序：
1. 先创建顶层：`古巴雪茄` (handle: `cigar-cuban`) 和 `非古巴雪茄` (handle: `cigar-world`)，记录返回的 `id`
2. 再创建 36 个品牌子分类，指定对应的 `parent_category_id`
3. 建立 `handle → category_id` 映射

---

### Step 4：更新菜单

1. 主导航菜单 ID：`01KKVE2WZ92RP6CY56HRRMYVB8`（已知）
2. 删除现有菜单项
3. 按 `data/menu_items.csv` 顺序创建新菜单项
   - 一级项：先创建，记录返回的 `id`
   - 二级项：传入 `parent_id` 关联

---

### Step 5：上传图片（已完成 ✅）

- 713 张真实图片 → 已上传至 `https://api.shangjiacigar.com/static/`
- 1 张占位图 → 已上传至 `https://api.shangjiacigar.com/static/1774260606710-placeholder.png`
- 映射文件：`data/image_url_map.json`

---

### Step 6：创建商品

#### 6.1 单商品测试导入（已完成 ✅）

测试商品：`prod_01KMERMSMDADGZT2D4YR3J7A0E`
- 标题：尼加拉瓜系列10週年限量版 Nicaragua 10th Anniversary (12枝)
- 已验证：后台显示长度152、环径56

#### 6.2 批量商品导入

循环调用 `POST /admin/products`，记录失败的 Handle 供补录。

```
Body: {
  title, handle, status: "published",
  images: [{ url: "..." }],
  thumbnail: "...",
  options: [{ title: "Size", values: ["Default"] }],
  variants: [{
    title: "Default Title",
    sku: handle + "-default",
    prices: [{ currency_code: "usd", amount: price_usd * 100 }]
  }],
  metadata: {
    attributes: [
      { key: "长度", value: "<length_mm>" },
      { key: "环径", value: "<ring_gauge>" }
    ]
  },
  category_ids: [品牌分类ID, 古巴雪茄顶层ID]
}
```

关键点：
- **价格**：CSV 的 `price_usd` 是美元数值，需 × 100 转为分
- **商品属性**：长度和环径存入 `metadata.attributes` 数组，不使用 API 的 `length` 字段
- **选项**：Medusa 要求至少有一个 option 才能创建变体，使用默认的 "Size" 选项
- **分类**：每个商品关联品牌分类 + 父分类（如古巴雪茄）
- **库存**：创建后通过 Inventory API 批量设置，暂设 999

---

### Step 7：关联品牌与商品

```
POST /admin/brands/{brandId}/products
Body: { add: [productId1, productId2, ...] }
```

按品牌批量处理，同一品牌的商品一起关联。

---

## API 端点速查

| 操作 | 端点 | 方法 |
|------|------|------|
| 商品列表 | `/admin/products` | GET |
| 创建商品 | `/admin/products` | POST |
| 删除商品 | `/admin/products/:id` | DELETE |
| 品牌列表 | `/admin/brands` | GET |
| 创建品牌 | `/admin/brands` | POST |
| 删除品牌 | `/admin/brands/:id` | DELETE |
| 分类列表 | `/admin/product-categories` | GET |
| 创建分类 | `/admin/product-categories` | POST |
| 删除分类 | `/admin/product-categories/:id` | DELETE |
| 菜单列表 | `/admin/menus` | GET |
| 菜单项操作 | `/admin/menus/:id/items` | POST/DELETE |
| 图片上传 | `/admin/uploads` | POST |
| 主导航菜单ID | `01KKVE2WZ92RP6CY56HRRMYVB8` | — |

**Base URL**: `https://api.shangjiacigar.com`
**Auth Header**: `Authorization: Bearer <token>`

---

## 待确认事项

- [x] 图片上传（已完成）
- [x] `products.csv` 含生产 URL（已完成）
- [ ] Step 1：清空现有数据（待执行）
- [ ] Step 2：导入品牌（待执行）
- [ ] Step 3：创建分类（待执行）
- [ ] Step 4：更新菜单（待执行）
- [ ] Step 6.1：单商品测试（待执行）
- [ ] Step 6.2：批量导入（待执行）
- [ ] Step 7：关联品牌（待执行）

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `data/products.csv` | 含生产 URL 的商品数据 |
| `data/brands.csv` | 36 个品牌定义 |
| `data/categories.csv` | 分类结构 |
| `data/menu_items.csv` | 菜单结构 |
| `data/image_url_map.json` | 图片映射 |
| `scripts/batch-upload-images.py` | 图片上传脚本 |
| `src/scripts/seed-brands.ts` | 品牌描述参考 |
