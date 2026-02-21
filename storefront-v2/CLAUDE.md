# Storefront V2（主力开发）

新版店铺前端，正在积极开发中。所有新的店铺功能都应在此实现。

## 技术栈

- Next.js 16 + React 19 + TypeScript
- Radix UI + shadcn/ui 组件体系（`components/ui/`）
- Tailwind CSS 4 + tw-animate-css
- Zustand 5（状态管理）
- React Hook Form + Zod（表单）
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

大部分页面已对接 Medusa 后端 API，少量页面仍有 mock 数据残留。

### 已对接 API

- 首页：公告栏、导航菜单、产品合集（hot-picks / featured-cuban / limited-editions）
- 商品：详情页、分类页
- 内容：文章列表页、文章详情页
- 认证：登录、注册、密码重置、AuthGuard 路由保护
- 账户：概览、个人资料编辑、收货地址 CRUD、订单历史

### 仍使用 mock 数据

- `app/cart/page.tsx` — 推荐商品区块仍用 `products` 常量
- `components/product/category-page-content.tsx` — 导入 `categories` 常量用于 UI 展示

### 待实现

- 购物车对接 Medusa Cart API（当前用 Zustand 本地状态）
- 结账流程对接支付/订单 API
- 多语言集成
- 搜索功能

### 后端 API 约定

- 后端地址：`http://localhost:9000`
- Store API 前缀：`/store/`
- 内容 API：`/store/content/{resource}`
- 多语言：请求时传 `x-medusa-locale` header 或 `?locale=` 参数

## 项目结构

```
app/
  page.tsx                # 首页
  product/[handle]/       # 商品详情
  category/[slug]/        # 分类页
  articles/               # 文章列表 & 详情
  cart/                   # 购物车
  checkout/               # 结账流程
  login/                  # 登录
  register/               # 注册
  forgot-password/        # 密码重置
  account/                # 账户管理
    layout.tsx            #   侧边栏布局
    page.tsx              #   概览
    profile/              #   个人资料编辑
    addresses/            #   收货地址 CRUD
    orders/               #   订单历史
  api/                    # API 代理路由
    auth/                 #   认证（登录/注册/密码重置/获取用户）
    account/              #   账户（customer/addresses/orders）
    products/             #   商品列表
    brands/               #   品牌列表
    categories/           #   分类
    regions/              #   地区
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
  proxy.ts                # proxyToMedusa() 通用 API 代理
  medusa-proxy.ts         # medusaProxy() 完整代理（含查询参数）
  medusa.ts               # Medusa JS SDK 实例
  cart-store.ts           # Zustand 购物车状态（本地，待对接 API）
  utils.ts                # cn() 等工具函数
  data/                   # 数据获取函数 + mock fallback（逐步清理中）
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

### 状态管理

全局状态用 Zustand store（`lib/cart-store.ts` 为参考），派生数据用纯函数 selector：

```ts
export const useCart = create<CartState>((set, get) => ({ ... }))
export function selectTotalItems(state: CartState) { ... }
```

### UI 组件

`components/ui/` 下是 shadcn/ui 生成的组件，样式通过 `cn()` 工具函数合并（clsx + tailwind-merge）。新增 UI 组件优先用 `npx shadcn@latest add <component>`。

### 多语言（待实现）

v1 使用 `[locale]` 动态路由 + next-intl，v2 尚未集成。实现时参考 v1 的 `storefront/src/app/[locale]/` 结构。
