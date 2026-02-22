# Storefront V2（主力开发）

新版店铺前端。所有新的店铺功能都应在此实现。

## 技术栈

- Next.js 16 + React 19 + TypeScript
- Radix UI + shadcn/ui 组件体系（`components/ui/`）
- Tailwind CSS 4 + tw-animate-css
- Zustand 5（状态管理）
- React Hook Form + Zod（表单）
- next-intl 4.8.3（多语言）
- @medusajs/js-sdk 2.13.1（Medusa SDK）
- Lucide Icons
- Sonner（toast 通知）
- Embla Carousel（轮播）

## 开发命令

```bash
npm run dev     # 启动开发服务器
npm run build
npm run lint
```

## 当前状态

绝大部分页面已对接 Medusa 后端 API，多语言、购物车、搜索均已完成。结账流程 UI 已有但 Stripe 支付未集成。

### 已对接 API

- 首页：公告栏、导航菜单、产品合集（hot-picks / featured-cuban / limited-editions）
- 商品：详情页、分类页
- 内容：文章列表页、文章详情页
- 认证：登录、注册、密码重置、AuthGuard 路由保护
- 账户：概览、个人资料编辑、收货地址 CRUD、订单历史
- 购物车：完整 Cart API 对接（创建、增删改商品、运费、优惠码、支付会话、完成订单）
- 搜索：`/search` 页面，支持关键词搜索 + 分页
- 多语言：`[locale]` 动态路由，支持 zh-TW（默认）、zh-CN、en

### 仍使用 mock 数据

- `app/[locale]/cart/page.tsx` — 推荐商品区块仍用 `lib/data/products.ts` 的 mock 数据
- `components/product/category-page-content.tsx` — 侧边栏分类列表仍用 `lib/data/categories.ts` 的 mock 数据

### 待实现

- Stripe 支付集成（`@stripe/react-stripe-js` + `@stripe/stripe-js` 尚未安装，结账页面为纯 HTML 表单）
- 结账流程完善：运费方式对接后端 API（当前硬编码）、表单验证、订单提交对接 complete API
- 清理 `lib/data/` 下不再使用的 mock 文件

### 后端 API 约定

- 后端地址：`http://localhost:9000`
- Store API 前缀：`/store/`
- 内容 API：`/store/content/{resource}`
- 多语言：请求时传 `x-medusa-locale` header 或 `?locale=` 参数

## 项目结构

```
app/
  [locale]/               # 多语言动态路由（zh-TW / zh-CN / en）
    page.tsx              #   首页
    product/[handle]/     #   商品详情
    category/[slug]/      #   分类页
    articles/             #   文章列表 & 详情
    cart/                 #   购物车
    checkout/             #   结账流程
      success/            #   订单成功页
    search/               #   搜索结果页
    login/                #   登录
    register/             #   注册
    forgot-password/      #   密码重置
    account/              #   账户管理
      layout.tsx          #     侧边栏布局
      page.tsx            #     概览
      profile/            #     个人资料编辑
      addresses/          #     收货地址 CRUD
      orders/             #     订单历史
  api/                    # API 代理路由
    auth/                 #   认证（登录/注册/密码重置/获取用户）
    account/              #   账户（customer/addresses/orders）
    cart/                 #   购物车（创建/更新/商品/运费/优惠码/支付/完成）
    products/             #   商品列表
    brands/               #   品牌列表
    categories/           #   分类
    regions/              #   地区
i18n/
  routing.ts              # 支持语言 + 默认语言配置
  request.ts              # 服务端请求配置，自动加载翻译文件
  navigation.ts           # 国际化导航工具（Link, redirect, usePathname）
messages/
  zh-TW.json              # 繁体中文翻译（默认语言）
  zh-CN.json              # 简体中文翻译
  en.json                 # 英文翻译
components/
  home/                   # 首页区块组件
  layout/                 # Header, Footer, LayoutShell
  product/                # 商品卡片、详情、分类页
  articles/               # 文章列表
  auth-guard.tsx          # 路由保护（/account, /checkout, /orders）
  ui/                     # shadcn/ui 基础组件（勿手动修改）
hooks/                    # 自定义 hooks
lib/
  auth.ts                 # 认证工具（token 管理、登录、注册、登出）
  cart.ts                 # 购物车 API 客户端（类型定义 + 全部操作函数）
  cart-store.ts           # Zustand 购物车 store（后端驱动，API 调用 → 更新 store → UI 响应）
  proxy.ts                # proxyToMedusa() 通用 API 代理
  medusa-proxy.ts         # medusaProxy() 完整代理（含查询参数）
  medusa.ts               # Medusa JS SDK 实例
  utils.ts                # cn() 等工具函数
  data/                   # 数据获取函数 + mock fallback（逐步清理中）
middleware.ts             # next-intl 语言路由中间件（语言检测 + 路由重写）
```

## 代码模式

### API 代理路由

前端通过 `/api/*` 代理路由访问 Medusa 后端，自动附加 publishable key 和 auth token：

```ts
import { proxyToMedusa } from "@/lib/proxy"

export async function GET(req: NextRequest) {
  return proxyToMedusa(req, "/store/customers/me/addresses")
}
```

### 认证

Token 存储在 localStorage（`medusa_customer_token`），通过 `lib/auth.ts` 统一管理：

```ts
import { login, logout, getCustomer, isLoggedIn, getToken } from "@/lib/auth"
```

`setToken()` / `removeToken()` 会派发 `auth-change` 自定义事件，Header 等组件监听此事件实时同步登录状态。

### 购物车

`lib/cart.ts` 提供完整的购物车 API 客户端，`lib/cart-store.ts` 是后端驱动的 Zustand store：

```ts
// API 操作（lib/cart.ts）
import { createCart, addLineItem, updateLineItem, removeLineItem } from "@/lib/cart"

// Zustand store（lib/cart-store.ts）— 调用 API → 更新 store → UI 自动响应
import { useCartStore } from "@/lib/cart-store"
const { items, addItem, removeItem, updateQuantity } = useCartStore()
```

Cart ID 持久化在 localStorage（`medusa_cart_id`），页面加载时自动恢复。

### 状态管理

全局状态用 Zustand store，派生数据用纯函数 selector：

```ts
export const useCart = create<CartState>((set, get) => ({ ... }))
export function selectTotalItems(state: CartState) { ... }
```

### 多语言

基于 next-intl，所有页面在 `app/[locale]/` 下，支持 zh-TW（默认）、zh-CN、en：

```ts
// 服务端组件
import { getTranslations } from "next-intl/server"
const t = await getTranslations("ProductPage")

// 客户端组件
import { useTranslations } from "next-intl"
const t = useTranslations("Common")

// 国际化导航（自动带 locale 前缀）
import { Link, redirect, usePathname } from "@/i18n/navigation"
```

翻译文件在 `messages/{locale}.json`，按命名空间组织（Common、Header、ProductPage 等）。

### UI 组件

`components/ui/` 下是 shadcn/ui 生成的组件，样式通过 `cn()` 工具函数合并（clsx + tailwind-merge）。新增 UI 组件优先用 `npx shadcn@latest add <component>`。
