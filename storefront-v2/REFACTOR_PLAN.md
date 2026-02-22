# Storefront-v2 重构计划

## 背景

以 storefront-v2 为主体，将 storefront（v1）的后端集成能力移植过来。v2 拥有更好的 UI 设计（shadcn/ui + Radix UI 组件库、Mega Menu、精心设计的首页），v1 拥有完整的 Medusa 后端集成。重构目标是两者合一。

## 实施步骤

### 第一步：Medusa API 接入 ✅ 已完成

建立与后端的通信通道。

- [x] 安装 `@medusajs/js-sdk@2.13.1`
- [x] 创建 `.env.local`（`NEXT_PUBLIC_MEDUSA_BACKEND_URL`、`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`）
- [x] 移植 `lib/medusa.ts`、`lib/medusa-proxy.ts`、`lib/proxy.ts`
- [x] 移植 API 代理路由（products、categories、brands、regions）
- [x] 更新 `next.config.mjs` images 配置

### 第二步：数据源替换 ✅ 基本完成

将静态 mock 数据替换为 Medusa API 调用。

- [x] 首页区块：公告栏、导航菜单、产品合集（hot-picks / featured-cuban / limited-editions）
- [x] 商品详情页：对接产品 API，支持变体选择、规格展示
- [x] 分类页：对接分类 API，支持筛选、排序、分页
- [x] 文章页：对接文章列表 + 详情 API
- [ ] 购物车页推荐商品区块仍用 mock 数据（`app/cart/page.tsx`）
- [ ] 分类页侧边栏分类列表仍用 mock（`category-page-content.tsx`）

### 第三步：用户认证 ✅ 已完成

- [x] 移植 `lib/auth.ts`（JWT token 管理 + `auth-change` 事件）
- [x] 登录、注册、密码重置页面
- [x] AuthGuard 组件保护 /account、/checkout、/orders
- [x] 账户管理：概览、个人资料编辑、收货地址 CRUD、订单历史
- [x] Header 登录状态实时同步

### 第四步：购物车对接 Medusa ✅ 已完成

- [x] 9 个 Cart API 代理路由（create、get/update、line-items CRUD、shipping、promotions、payment-sessions、complete）
- [x] `lib/cart.ts` 购物车 API 工具库（类型 + 全部操作函数）
- [x] Zustand store 重写为后端驱动模式（API 调用 → 更新 store → UI 响应）
- [x] Cart ID 持久化到 localStorage（`medusa_cart_id`）
- [x] 购物车页面适配（变体标题、价格、数量操作）
- [x] 商品详情页加购 + 立即购买（清空购物车 → 加购 → 跳转结账）
- [x] 商品卡片快速加购（单变体商品）
- [x] Header 购物车计数 + bounce 动画
- [x] Toast 通知反馈（sonner）

### 第五步：搜索功能 ⬜ 待实现

- [ ] 搜索页面（`app/search/page.tsx`）
- [ ] Header 搜索按钮连接
- [ ] 搜索结果展示 + 分页

### 第六步：Stripe 支付与结账 ⬜ 待实现

- [ ] 集成 Stripe React SDK
- [ ] 结账页面对接 Medusa 支付会话
- [ ] Stripe webhook 路由
- [ ] 订单确认/成功/失败页面

### 第七步：i18n 多语言路由 ⬜ 待实现

所有功能稳定后，最后加入多语言支持。

- [ ] `[locale]` 动态路由，所有页面迁入 `app/[locale]/`
- [ ] 移植 middleware.ts（语言检测）
- [ ] 移植翻译文件（zh-CN、zh-TW、en）
- [ ] 更新所有页面内链接

## 残留 mock 数据清理

| 文件 | 内容 | 状态 |
|------|------|------|
| `app/cart/page.tsx` | 推荐商品区块 | 待替换为 API |
| `components/product/category-page-content.tsx` | 侧边栏分类列表 | 待替换为 API |
| `components/home/flash-sale.tsx` | 快速加购已移除，改为"查看详情"链接 | ✅ 已处理 |

## 从 v1 移植的关键文件

```
v1 → v2 文件映射：

lib/medusa.ts          → lib/medusa.ts          # SDK 初始化 ✅
lib/medusa-proxy.ts    → lib/medusa-proxy.ts    # 通用 API 代理 ✅
lib/proxy.ts           → lib/proxy.ts           # 认证代理 ✅
lib/api.ts             → lib/api.ts             # API 工具 ✅
lib/cart.ts            → lib/cart.ts            # 购物车 API 工具库 ✅
lib/auth.ts            → lib/auth.ts            # 认证逻辑 ✅
lib/i18n.ts            → lib/i18n.ts            # 国际化（待实现）
lib/useLocale.ts       → hooks/useLocale.ts     # 语言 hook（待实现）
middleware.ts          → middleware.ts           # 语言路由中间件（待实现）
locales/*              → locales/*              # 翻译文件（待实现）
app/api/cart/*         → app/api/cart/*         # 购物车代理路由 ✅
app/api/auth/*         → app/api/auth/*         # 认证代理路由 ✅
app/api/account/*      → app/api/account/*      # 账户代理路由 ✅
```

## 可选功能（按需添加）

- 产品对比（v1 的 CompareProvider）
- 欢迎弹窗 + 语言选择器（v1 的 WelcomeGate）
- 优惠券弹窗（v1 的 CouponPopup）

## 原则

- 每一步完成后前端都应可独立运行
- 优先保留 v2 的组件和设计，只在必要时引入 v1 代码
- 数据层用 v1 的模式，UI 层用 v2 的组件
