# Storefront-v2 重构计划

## 背景

以 storefront-v2 为主体，将 storefront（v1）的后端集成能力移植过来。v2 拥有更好的 UI 设计（shadcn/ui + Radix UI 组件库、Mega Menu、精心设计的首页），v1 拥有完整的 Medusa 后端集成。重构目标是两者合一。

## 当前状态

### v2 已有
- Next.js 16 + React 19 + TypeScript
- 74 个 Radix UI / shadcn 基础组件
- 首页 9 大区块（轮播、闪购、品牌聚焦、限量版等）
- Mega Menu 导航、年龄验证弹窗
- Zustand 购物车（本地状态）
- 产品详情页、分类页、文章页、购物车页、结账页
- 深色金色主题设计系统

### v2 缺失（需从 v1 移植）
- Medusa 后端 API 集成
- 多语言（i18n）支持
- 用户认证（登录/注册/密码重置）
- 购物车与后端同步
- Stripe 支付
- 用户账户管理（个人资料/地址/订单）
- 搜索功能
- 产品对比功能
- 优惠券系统

## 实施步骤

### 第一步：Medusa API 接入 ✅ 已完成

建立与后端的通信通道。

- [x] 安装 `@medusajs/js-sdk@2.13.1`
- [x] 创建 `.env.local`（`NEXT_PUBLIC_MEDUSA_BACKEND_URL`、`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`）
- [x] 移植 `lib/medusa.ts`（SDK 初始化 + `fetchContent` 服务端数据获取）
- [x] 移植 `lib/medusa-proxy.ts`（通用 API 代理）
- [x] 移植 `lib/proxy.ts`（认证代理）
- [x] 移植 API 代理路由：`app/api/products/route.ts`、`app/api/categories/route.ts`、`app/api/brands/route.ts`、`app/api/brands/[handle]/route.ts`、`app/api/regions/route.ts`
- [x] 更新 `next.config.mjs` images 配置为 `remotePatterns`
- [ ] Cart、auth、account、webhook 代理路由（延后到对应步骤）

### 第二步：数据源替换

将静态 mock 数据替换为 Medusa API 调用。

- 首页各区块：从 API 获取推荐产品、分类、文章
- 产品列表/详情页：对接产品 API，支持筛选、排序、分页
- 分类页：对接分类 API
- 文章页：对接文章 API
- 删除 `lib/data/` 下的静态数据文件（或保留为 fallback）

### 第三步：用户认证

- 移植 `lib/auth.ts`（JWT token 管理）
- 添加登录、注册、密码重置页面
- 添加 AuthGuard 组件保护需要登录的页面
- 添加账户管理页面（个人资料、地址簿、订单历史）

### 第四步：购物车对接 Medusa

- 保留 Zustand store 架构，增加 Medusa Cart API 同步逻辑
- 购物车 ID 持久化到 localStorage
- 支持：添加/删除/更新商品、优惠码、配送方式选择

### 第五步：Stripe 支付与结账

- 集成 Stripe React SDK
- 改造结账页面，对接 Medusa 支付会话
- 添加 Stripe webhook 路由
- 完成订单确认/成功/失败页面

### 第六步：i18n 多语言路由

所有功能稳定后，最后加入多语言支持。

- 添加 `[locale]` 动态路由，将所有页面迁入 `app/[locale]/` 下
- 移植 v1 的 `middleware.ts`（语言检测：URL → Cookie → Accept-Language → 默认）
- 移植 `locales/` 翻译文件（zh-CN、zh-TW、en）
- 移植 `lib/i18n.ts` 和 `useLocale` hook
- 更新所有页面内链接，加上 locale 前缀

## 从 v1 移植的关键文件

```
v1 → v2 文件映射：

lib/medusa.ts          → lib/medusa.ts          # SDK 初始化 ✅
lib/medusa-proxy.ts    → lib/medusa-proxy.ts    # 通用 API 代理 ✅
lib/proxy.ts           → lib/proxy.ts           # 认证代理 ✅
lib/api.ts             → lib/api.ts             # API 工具
lib/cart.ts            → lib/cart.ts            # 购物车逻辑（融合 Zustand）
lib/auth.ts            → lib/auth.ts            # 认证逻辑
lib/i18n.ts            → lib/i18n.ts            # 国际化
lib/useLocale.ts       → hooks/useLocale.ts     # 语言 hook
middleware.ts          → middleware.ts           # 语言路由中间件
locales/*              → locales/*              # 翻译文件
app/api/*              → app/api/*              # API 代理路由（部分完成 ✅）
```

## 可选功能（按需添加）

- 产品对比（v1 的 CompareProvider）
- 欢迎弹窗 + 语言选择器（v1 的 WelcomeGate）
- 优惠券弹窗（v1 的 CouponPopup）

## 原则

- 每一步完成后前端都应可独立运行
- 优先保留 v2 的组件和设计，只在必要时引入 v1 代码
- 数据层用 v1 的模式，UI 层用 v2 的组件
