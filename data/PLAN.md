# 商品数据导入计划

## 数据文件

所有数据文件位于 `data/` 目录。

| 文件 | 说明 | 数量 |
|------|------|------|
| `brands.csv` | 品牌定义 | 36 个 |
| `categories.csv` | 商品分类（两层树） | 38 个 |
| `menu_items.csv` | 菜单项（含嵌套关系） | 45 项 |
| `products.csv` | 当前线上商品数据源 | 429 条 |
| `image_url_map_reuploaded.json` | 当前正确的图片本地路径→远程URL映射 | 712 条 |

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
| `price_usd` | 美元价格（已确认使用 USD） |
| `length_mm` / `ring_gauge` | 尺寸（部分商品缺失） |
| `handle` | 商品 URL handle |
| `category_slug` | 归属品牌分类 slug |
| `cuban_parent_slug` | 固定 `cigar-cuban`（用于同时挂两个分类） |
| `image1~5` | 当前 CSV 中为线上远程 URL；如媒体丢失，可通过 remap 文件重传恢复 |

**图片状态**（已恢复并验证）:
- 本轮有效远程图片 URL：712 张（`https://api.shangjiacigar.com/static/...`）
- 占位图已重新上传并纳入商品更新
- 前端已通过浏览器验证图片恢复正常显示

---

## 实施步骤

### Step 1：清空现有数据（线上环境）

顺序：商品 → 品牌 → 分类（避免外键关联报错）

1. **删除所有现有商品**：`GET /admin/products?limit=100` 获取列表，逐条 `DELETE /admin/products/:id`
2. **删除所有品牌**：`GET /admin/brands` 获取列表，逐条 `DELETE /admin/brands/:id`
3. **删除所有商品分类**：`GET /admin/product-categories` 获取列表，逐条 `DELETE /admin/product-categories/:id`

> ⚠️ 删除前无需备份，线上均为测试数据，原始数据在 CSV 文件中。

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

### Step 4：更新菜单（已完成 ✅）

1. 主导航菜单 ID：`01KMJ1RHFBZWZ40P72520DHX97`
2. 按 `data/menu_items.csv` 顺序创建新菜单项
   - 一级项先创建，二级项通过 `parent_id` 关联

---

### Step 5：上传图片（已完成 ✅）

- 首轮上传后的媒体文件因 `docker compose down -v` 被删除
- 已使用 `/product_images` 原始目录重新上传 712 个实际远程 URL
- 商品图片已批量重写为新 URL，结果：`429/429` 成功
- 当前映射文件：`data/image_url_map_reuploaded.json`
- 验证页面：`/zh-CN/product/davidoff-cuban-10-nicaragua-10th-anniversary` 图片已正常显示

---

### Step 6：创建商品

#### 6.1 单商品测试导入（已完成 ✅）

测试商品：`prod_01KMERMSMDADGZT2D4YR3J7A0E`
- 标题：尼加拉瓜系列10週年限量版 Nicaragua 10th Anniversary (12枝)
- 已验证：后台显示长度152、环径56

#### 6.2 批量商品导入（已完成 ✅）

已成功创建 `429/429` 个商品，并已加入默认 Sales Channel。

```
Body: {
  title, handle, status: "published",
  categories: [{ id: "品牌分类ID" }, { id: "父分类ID" }],
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
  }
}
```

关键点：
- 商品分类字段实际使用 `categories: [{ id }]`，不是 `category_ids`
- 当前图片规则：`thumbnail = 第一张图`，`images = 剩余图片`
- 价格使用 USD，Store API 需配合 region 才能返回计算价格

---

### Step 7：关联品牌与商品（已完成 ✅）

```
POST /admin/brands/{brandId}/products
Body: { product_id: "prod_xxx" }
```

- 品牌与商品关系为多对一
- 接口一次只接收一个 `product_id`
- 已完成补录，结果：`429/429` 成功
- 结果文件：`data/brand_link_report.json`

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
| 菜单项操作 | `/admin/menu-items` | POST/DELETE |
| 图片上传 | `/admin/uploads` | POST |
| 主导航菜单ID | `01KMJ1RHFBZWZ40P72520DHX97` | — |

**Base URL**: `https://api.shangjiacigar.com`
**Auth Header**: `Authorization: Bearer <token>`

### 认证方式

通过 agent-browser 登录管理后台获取 JWT token，然后使用 curl 调用 API：

- **登录地址**：`https://admin.shangjiacigar.com/login`
- **账号**：`admin@test.com`
- **密码**：`admin123456`
- **数据文件**：使用 `products.csv`（USD 价格，且已回写为最新线上图片 URL）
- **备份**：不需要，线上均为测试数据

---

## 待确认事项

- [x] Step 1：清空现有数据（已完成）
- [x] Step 2：导入品牌（已完成）
- [x] Step 3：创建分类（已完成）
- [x] Step 4：更新菜单（已完成）
- [x] Step 5：上传图片（已完成，且已二次重传恢复）
- [x] Step 6.2：批量导入（已完成）
- [x] Step 7：关联品牌（已完成）
- [x] 创建 Region：`Default` / USD / CN+HK+US+Europe（已完成）
- [x] 商品加入默认 Sales Channel（已完成）
- [x] storefront-v2 已验证可加载商品与图片（已完成）

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `data/products.csv` | 当前线上商品数据源（已回写为最新远程图片 URL） |
| `data/brands.csv` | 36 个品牌定义 |
| `data/categories.csv` | 分类结构 |
| `data/menu_items.csv` | 菜单结构 |
| `data/image_url_map_reuploaded.json` | 当前正确的图片映射 |
| `scripts/batch-upload-images.py` | 首轮图片上传脚本 |
| `src/scripts/seed-brands.ts` | 品牌描述参考 |
