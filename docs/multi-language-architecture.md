# TIMECIGAR 多语言与多市场架构方案

## 概述

本文档梳理 Medusa v2 中与国际化相关的三个核心概念，以及 TIMECIGAR 项目的选型决策和未来扩展路径。

## 三个正交维度

| 维度 | Medusa 概念 | 控制范围 | 示例 |
|------|------------|---------|------|
| 语言 | Translation Module + locale | 内容展示语言 | zh-CN / zh-TW / en |
| 地理/经济 | Region | 货币、税率、支付、物流 | 中国大陆(CNY) / 北美(USD) |
| 平台/触点 | Sales Channel + Publishable API Key | 商品可见性、渠道归属 | 官网 / App / B2B |

这三个维度相互独立，可以自由组合。

---

## 当前方案：Translation Module（纯多语言）

### 适用场景

同一批商品面向不同语言用户，商品目录、库存、定价完全一致，只是展示语言不同。

### 架构

```
Medusa 后端
└── Translation Module（v2.12.4+）
    ├── product.title → { "zh-CN": "...", "zh-TW": "...", "en": "..." }
    ├── product.description → { ... }
    └── 自定义模型（article, brand, announcement 等）

Storefront（Next.js）
├── /zh-CN/*  ← cookie NEXT_LOCALE=zh-CN
├── /zh-TW/*  ← cookie NEXT_LOCALE=zh-TW
└── /en/*     ← cookie NEXT_LOCALE=en
```

### 数据流

```
请求 GET /store/products?locale=zh-TW
  → Medusa 查询 product 表
  → Translation Module 自动替换 translatable 字段
  → 返回繁體中文内容
```

### 代码层面

```typescript
// Store API 路由
const { data: products } = await query.graph(
  { entity: "product", fields: ["id", "title", "description"] },
  { locale: req.locale }  // 一行搞定
)

// 自定义模型定义
export const Brand = model.define("brand", {
  name: model.text().translatable(),
  description: model.text().translatable().nullable(),
})
```

### 优势

- 一份商品数据，一份库存，零同步成本
- 新增语言只需添加翻译，无需复制商品
- Admin UI 内联编辑翻译，批量管理

### 当前实现状态

- [x] Translation Module 安装配置
- [x] 自定义模型 translatable 字段改造
- [x] Store API 路由 locale 参数传递
- [x] Admin UI 资源编辑页语言切换器
- [x] Admin UI 翻译管理设置页（批量编辑 + 进度统计）
- [x] Storefront 多语言内容集成
- [x] WelcomeGate 首次访问语言选择弹窗
- [x] Header 语言切换器

---

## 备选方案：Sales Channel 分店（多市场）

### 适用场景

不同市场的商品目录本身不同，需要独立管理。例如：
- 英文站只卖非古巴品牌（美国禁运）
- 繁中站卖全线品牌
- 不同市场独立定价、独立库存

### 架构

```
Admin 后台（一个）
├── Sales Channel: "EN Store"
├── Sales Channel: "繁中店"
└── Sales Channel: "简中店"

Publishable API Key A → "EN Store"
Publishable API Key B → "繁中店"
Publishable API Key C → "简中店"
```

### 数据流

```
Storefront EN 请求头: x-publishable-api-key: {Key A}
  → Medusa 自动过滤 Sales Channel = "EN Store"
  → 只返回该渠道下的商品
  → 订单自动归属到 "EN Store"
```

### Storefront 配置

```typescript
// storefront/lib/medusa-client.ts
import Medusa from "@medusajs/js-sdk"

// 根据 locale 选择不同的 Publishable API Key
const API_KEYS: Record<string, string> = {
  "en": process.env.MEDUSA_PUB_KEY_EN!,
  "zh-TW": process.env.MEDUSA_PUB_KEY_ZHTW!,
  "zh-CN": process.env.MEDUSA_PUB_KEY_ZHCN!,
}

export function getMedusaClient(locale: string) {
  return new Medusa({
    baseUrl: process.env.MEDUSA_BACKEND_URL!,
    publishableKey: API_KEYS[locale],
  })
}
```

### 优势

- 商品目录完全独立，精细控制每个市场的商品可见性
- 订单按渠道归属，便于分市场统计
- 可配合 Region 实现不同市场不同定价

### 劣势

- 共享商品需要关联到多个 Sales Channel，管理成本增加
- 库存如果共享需要额外处理
- 商品信息修改需要同步到所有渠道

---

## 混合方案：Sales Channel + Translation Module

### 适用场景

大部分商品共享，部分商品按市场独占，同时需要多语言。

### 架构

```
Sales Channel 控制「卖什么」
  → 共享商品关联到所有 Sales Channel
  → 独占商品只关联到特定 Sales Channel

Translation Module 控制「怎么展示」
  → 所有商品的名称/描述按 locale 翻译

Region 控制「怎么卖」
  → 中国大陆: CNY + 支付宝 + 顺丰
  → 北美: USD + Stripe + FedEx
```

### 示例

```
Cohiba Siglo VI（古巴品牌）
  ├── Sales Channel: 繁中店 ✓, 简中店 ✓, EN Store ✗（美国禁运）
  ├── Translation: zh-CN="高希霸世纪六号", en="Cohiba Siglo VI"
  └── Region: 中国大陆 ¥2,880 / 港澳台 HK$3,200

Davidoff Winston Churchill
  ├── Sales Channel: 繁中店 ✓, 简中店 ✓, EN Store ✓（全球可售）
  ├── Translation: zh-CN="大卫杜夫丘吉尔", en="Davidoff Winston Churchill"
  └── Region: 中国大陆 ¥1,680 / 北美 $228
```

---

## TIMECIGAR 选型建议

### 当前阶段

使用 **Translation Module 纯多语言方案**（已实现）。

理由：
- 商品目录统一，面向中文用户群（简中/繁中/英文）
- 无需按市场差异化商品可见性
- 一份数据，维护成本最低

### 未来扩展触发条件

当出现以下任一情况时，考虑叠加 Sales Channel：

1. **市场差异化需求** — 某些品牌/商品只在特定市场销售
2. **独立定价需求** — 不同市场价格体系完全不同（配合 Region）
3. **独立运营需求** — 不同市场团队独立管理商品上下架
4. **合规需求** — 某些地区法规限制特定商品销售

### 扩展路径

```
Phase 1（当前）: Translation Module
  → 纯多语言，一份商品数据

Phase 2（按需）: + Region
  → 多币种定价（CNY / USD / HKD）
  → 不同地区税率和物流

Phase 3（按需）: + Sales Channel
  → 市场差异化商品目录
  → 按渠道独立运营
```

每个 Phase 独立叠加，不需要重构前一阶段的工作。
